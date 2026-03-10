import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import { authMiddleware, createToken, getAuthenticatedAccount, requireRole } from "./auth.js";
import { config } from "./config.js";
import { connectDatabase, ensureCollectionsAndIndexes } from "./db.js";
import { Company, Investor, Stock, Transaction } from "./models.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

function normalizeError(error) {
  return error instanceof Error ? error.message : "Unexpected error";
}

function sanitizeCompany(company) {
  if (!company) return null;
  const { password_hash, ...safeCompany } = company;
  return safeCompany;
}

function sanitizeInvestor(investor) {
  if (!investor) return null;
  const { password_hash, ...safeInvestor } = investor;
  return safeInvestor;
}

function sanitizeStock(stock) {
  if (!stock) return null;
  return stock;
}

function sanitizeTransaction(transaction) {
  if (!transaction) return null;
  return transaction;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function buildCompanyPayload(body) {
  return {
    name: String(body.name || "").trim(),
    symbol: String(body.symbol || "").trim().toUpperCase(),
    sector: String(body.sector || "").trim(),
    industry: String(body.industry || "").trim(),
    exchange: String(body.exchange || "").trim(),
    founded_year: Math.trunc(toNumber(body.founded_year, 0)),
    market_cap: toNumber(body.market_cap, 0),
    website: String(body.website || "").trim(),
    headquarters: String(body.headquarters || "").trim(),
    executives: Array.isArray(body.executives) ? body.executives : parseJsonField(body.executives, []),
    tags: toStringArray(body.tags),
    verified: toBoolean(body.verified, false),
  };
}

function buildInvestorPayload(body) {
  return {
    name: String(body.name || "").trim(),
    phone: String(body.phone || "").trim(),
    account_balance: toNumber(body.account_balance, 0),
    risk_profile: String(body.risk_profile || "Moderate").trim(),
    address: parseJsonField(body.address, {
      line1: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
    }),
    portfolio: Array.isArray(body.portfolio) ? body.portfolio : parseJsonField(body.portfolio, []),
    watchlist: toStringArray(body.watchlist),
    preferred_sectors: toStringArray(body.preferred_sectors),
    verified: toBoolean(body.verified, false),
  };
}

function buildStockPayload(body, company) {
  const payload = {
    stock_id: String(body.stock_id || uuidv4()).trim(),
    symbol: String(body.symbol || "").trim().toUpperCase(),
    company_id: String(body.company_id || company.company_id).trim(),
    name: String(body.name || "").trim(),
    current_price: toNumber(body.current_price, 0),
    market_cap: toNumber(body.market_cap, 0),
    pe_ratio: toNumber(body.pe_ratio, 0),
    dividend_yield: toNumber(body.dividend_yield, 0),
    volume: Math.trunc(toNumber(body.volume, 0)),
    currency: String(body.currency || "USD").trim().toUpperCase(),
    exchange: String(body.exchange || company.exchange).trim(),
    sector: String(body.sector || company.sector).trim(),
    is_active: toBoolean(body.is_active, true),
    tags: toStringArray(body.tags),
    financials: parseJsonField(body.financials, body.financials),
    exchange_info: parseJsonField(body.exchange_info, body.exchange_info),
    price_history: Array.isArray(body.price_history) ? body.price_history : parseJsonField(body.price_history, []),
    analyst_ratings: Array.isArray(body.analyst_ratings)
      ? body.analyst_ratings
      : parseJsonField(body.analyst_ratings, []),
  };

  if (!payload.market_cap) {
    payload.market_cap = payload.current_price * Math.max(payload.volume, 1);
  }

  return payload;
}

function buildTransactionPayload(body) {
  return {
    stock_symbol: String(body.stock_symbol || "").trim().toUpperCase(),
    quantity: Math.trunc(toNumber(body.quantity, 0)),
    price: toNumber(body.price, 0),
    transaction_type: String(body.transaction_type || "BUY").trim().toUpperCase(),
    status: String(body.status || "COMPLETED").trim().toUpperCase(),
    order_details: parseJsonField(body.order_details, body.order_details),
    transaction_time: body.transaction_time ? new Date(body.transaction_time) : new Date(),
  };
}

async function createAuthResponse(account, role) {
  return {
    token: createToken(account),
    role,
    company: role === "company" ? sanitizeCompany(account) : null,
    investor: role === "investor" ? sanitizeInvestor(account) : null,
    user: {
      id: role === "company" ? account.company_id : account.investor_id,
      email: account.email,
      role,
      name: account.name,
    },
  };
}

async function applyTransaction(investor, stock, payload) {
  const quantity = payload.quantity;
  const price = payload.price > 0 ? payload.price : stock.current_price;
  const totalValue = Number((quantity * price).toFixed(2));
  const type = payload.transaction_type;
  const portfolio = [...(investor.portfolio || [])];
  const holdingIndex = portfolio.findIndex((item) => item.stock_symbol === stock.symbol);
  const holding = holdingIndex >= 0 ? { ...portfolio[holdingIndex] } : null;

  if (type === "BUY") {
    if (investor.account_balance < totalValue) {
      throw new Error("Insufficient account balance");
    }

    investor.account_balance = Number((investor.account_balance - totalValue).toFixed(2));

    if (holding) {
      const newQuantity = holding.quantity + quantity;
      const newInvestedValue = holding.invested_value + totalValue;
      holding.quantity = newQuantity;
      holding.invested_value = Number(newInvestedValue.toFixed(2));
      holding.average_price = Number((newInvestedValue / newQuantity).toFixed(2));
      portfolio[holdingIndex] = holding;
    } else {
      portfolio.push({
        stock_id: stock.stock_id,
        stock_symbol: stock.symbol,
        company_id: stock.company_id,
        company_name: stock.name,
        quantity,
        average_price: price,
        invested_value: totalValue,
      });
    }
  }

  if (type === "SELL") {
    if (!holding || holding.quantity < quantity) {
      throw new Error("Insufficient portfolio quantity to sell");
    }

    const remainingQuantity = holding.quantity - quantity;
    const remainingInvested = Math.max(0, Number((holding.average_price * remainingQuantity).toFixed(2)));
    investor.account_balance = Number((investor.account_balance + totalValue).toFixed(2));

    if (remainingQuantity === 0) {
      portfolio.splice(holdingIndex, 1);
    } else {
      holding.quantity = remainingQuantity;
      holding.invested_value = remainingInvested;
      portfolio[holdingIndex] = holding;
    }
  }

  investor.portfolio = portfolio;
  investor.updated_at = new Date();
  await Investor.updateOne(
    { investor_id: investor.investor_id },
    {
      $set: {
        account_balance: investor.account_balance,
        portfolio: investor.portfolio,
        updated_at: investor.updated_at,
      },
    }
  );

  await Stock.updateOne(
    { stock_id: stock.stock_id },
    {
      $set: {
        current_price: price,
        market_cap: Number((price * Math.max(stock.volume, 1)).toFixed(2)),
        updated_at: new Date(),
      },
      $push: {
        price_history: {
          date: payload.transaction_time,
          open: stock.current_price,
          high: Math.max(stock.current_price, price),
          low: Math.min(stock.current_price, price),
          close: price,
          volume: stock.volume,
        },
      },
    }
  );

  const transaction = await Transaction.create({
    transaction_id: uuidv4(),
    investor_id: investor.investor_id,
    stock_id: stock.stock_id,
    stock_symbol: stock.symbol,
    company_id: stock.company_id,
    quantity,
    price,
    total_value: totalValue,
    transaction_type: type,
    status: payload.status || "COMPLETED",
    order_details: payload.order_details || { order_type: "MARKET", notes: "" },
    transaction_time: payload.transaction_time,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return transaction;
}

app.get("/api/health", async (_req, res) => {
  const counts = await Promise.all([
    Company.countDocuments(),
    Investor.countDocuments(),
    Stock.countDocuments(),
    Transaction.countDocuments(),
  ]);

  res.json({
    ok: true,
    db: config.mongoDbName,
    collections: {
      company: counts[0],
      investor: counts[1],
      stock: counts[2],
      transaction: counts[3],
    },
  });
});

app.post("/api/auth/company/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const payload = buildCompanyPayload(req.body || {});

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const existing = await Company.findOne({ $or: [{ email: String(email).toLowerCase() }, { symbol: payload.symbol }] }).lean();
    if (existing) {
      return res.status(409).json({ error: "Company email or symbol already exists" });
    }

    const company = await Company.create({
      company_id: uuidv4(),
      email: String(email).trim().toLowerCase(),
      password_hash: await bcrypt.hash(String(password), 10),
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json(await createAuthResponse(company.toObject(), "company"));
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.post("/api/auth/company/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const company = await Company.findOne({ email: String(email || "").trim().toLowerCase() });
    if (!company) {
      return res.status(401).json({ error: "Invalid company credentials" });
    }

    const valid = await bcrypt.compare(String(password || ""), company.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid company credentials" });
    }

    return res.json(await createAuthResponse(company.toObject(), "company"));
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.post("/api/auth/investor/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const payload = buildInvestorPayload(req.body || {});

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const existing = await Investor.findOne({ email: String(email).trim().toLowerCase() }).lean();
    if (existing) {
      return res.status(409).json({ error: "Investor email already exists" });
    }

    const investor = await Investor.create({
      investor_id: uuidv4(),
      email: String(email).trim().toLowerCase(),
      password_hash: await bcrypt.hash(String(password), 10),
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json(await createAuthResponse(investor.toObject(), "investor"));
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.post("/api/auth/investor/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const investor = await Investor.findOne({ email: String(email || "").trim().toLowerCase() });
    if (!investor) {
      return res.status(401).json({ error: "Invalid investor credentials" });
    }

    const valid = await bcrypt.compare(String(password || ""), investor.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid investor credentials" });
    }

    return res.json(await createAuthResponse(investor.toObject(), "investor"));
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const result = await getAuthenticatedAccount(req.auth);
    if (!result) {
      return res.status(404).json({ error: "Account not found" });
    }

    return res.json(await createAuthResponse(result.account, result.role));
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.get("/api/companies", async (_req, res) => {
  try {
    const companies = await Company.find({}, { password_hash: 0 }).sort({ name: 1 }).lean();
    return res.json({ data: companies.map(sanitizeCompany) });
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.get("/api/investors", authMiddleware, async (_req, res) => {
  try {
    const investors = await Investor.find({}, { password_hash: 0 }).sort({ name: 1 }).lean();
    return res.json({ data: investors.map(sanitizeInvestor) });
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.get("/api/stocks", async (req, res) => {
  try {
    const query = {};
    if (req.query.company_id) query.company_id = String(req.query.company_id);
    if (req.query.symbol) query.symbol = String(req.query.symbol).toUpperCase();
    if (req.query.stock_id) query.stock_id = String(req.query.stock_id);
    if (req.query.is_active === "true") query.is_active = true;

    const stocks = await Stock.find(query).sort({ symbol: 1 }).lean();
    return res.json({ data: stocks.map(sanitizeStock) });
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.post("/api/stocks", authMiddleware, requireRole("company"), async (req, res) => {
  try {
    const company = await Company.findOne({ company_id: req.auth.id }).lean();
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    const payload = buildStockPayload(req.body || {}, company);
    payload.company_id = company.company_id;

    const existing = await Stock.findOne({ $or: [{ stock_id: payload.stock_id }, { symbol: payload.symbol }] }).lean();
    if (existing) {
      return res.status(409).json({ error: "Stock ID or symbol already exists" });
    }

    const stock = await Stock.create({
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json({ data: sanitizeStock(stock.toObject()) });
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.patch("/api/stocks/:stockId", authMiddleware, requireRole("company"), async (req, res) => {
  try {
    const company = await Company.findOne({ company_id: req.auth.id }).lean();
    const existingStock = await Stock.findOne({ stock_id: req.params.stockId }).lean();

    if (!company || !existingStock) {
      return res.status(404).json({ error: "Stock not found" });
    }
    if (existingStock.company_id !== company.company_id) {
      return res.status(403).json({ error: "You can edit only your own stocks" });
    }

    const payload = buildStockPayload({ ...existingStock, ...req.body, stock_id: existingStock.stock_id }, company);
    payload.company_id = company.company_id;
    payload.updated_at = new Date();

    const updated = await Stock.findOneAndUpdate(
      { stock_id: req.params.stockId },
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();

    return res.json({ data: sanitizeStock(updated) });
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.get("/api/transactions", authMiddleware, async (req, res) => {
  try {
    const query = {};
    if (req.query.investor_id) query.investor_id = String(req.query.investor_id);
    if (req.query.company_id) query.company_id = String(req.query.company_id);
    if (req.query.stock_symbol) query.stock_symbol = String(req.query.stock_symbol).toUpperCase();

    if (req.auth.role === "company" && !req.query.company_id) {
      query.company_id = req.auth.id;
    }
    if (req.auth.role === "investor" && !req.query.investor_id) {
      query.investor_id = req.auth.id;
    }

    const transactions = await Transaction.find(query).sort({ transaction_time: -1 }).lean();
    return res.json({ data: transactions.map(sanitizeTransaction) });
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.post("/api/transactions", authMiddleware, requireRole("investor"), async (req, res) => {
  try {
    const payload = buildTransactionPayload(req.body || {});
    if (!payload.stock_symbol || payload.quantity < 1 || !["BUY", "SELL"].includes(payload.transaction_type)) {
      return res.status(400).json({ error: "Valid stock_symbol, quantity, and transaction_type are required" });
    }

    const [investor, stock] = await Promise.all([
      Investor.findOne({ investor_id: req.auth.id }).lean(),
      Stock.findOne({ symbol: payload.stock_symbol }).lean(),
    ]);

    if (!investor || !stock) {
      return res.status(404).json({ error: "Investor or stock not found" });
    }

    const transaction = await applyTransaction({ ...investor }, stock, payload);
    const refreshedInvestor = await Investor.findOne({ investor_id: req.auth.id }, { password_hash: 0 }).lean();
    return res.status(201).json({
      data: sanitizeTransaction(transaction.toObject()),
      portfolio: refreshedInvestor?.portfolio || [],
      account_balance: refreshedInvestor?.account_balance || 0,
    });
  } catch (error) {
    return res.status(400).json({ error: normalizeError(error) });
  }
});

app.get("/api/portfolio", authMiddleware, requireRole("investor"), async (req, res) => {
  try {
    const investor = await Investor.findOne({ investor_id: req.auth.id }, { password_hash: 0 }).lean();
    if (!investor) {
      return res.status(404).json({ error: "Investor not found" });
    }

    return res.json({ data: investor.portfolio || [], account_balance: investor.account_balance });
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.post("/api/investors/watchlist", authMiddleware, requireRole("investor"), async (req, res) => {
  try {
    const symbol = String(req.body.symbol || "").trim().toUpperCase();
    if (!symbol) {
      return res.status(400).json({ error: "symbol is required" });
    }

    const stock = await Stock.findOne({ symbol }).lean();
    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const investor = await Investor.findOneAndUpdate(
      { investor_id: req.auth.id },
      { $addToSet: { watchlist: symbol }, $set: { updated_at: new Date() } },
      { new: true, projection: { password_hash: 0 } }
    ).lean();

    return res.json({ data: investor?.watchlist || [] });
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.get("/api/analysis/dashboard", authMiddleware, async (req, res) => {
  try {
    const [overview] = await Stock.aggregate([
      {
        $group: {
          _id: null,
          total_market_capitalization: { $sum: "$market_cap" },
          average_market_price: { $avg: "$current_price" },
          active_stocks: { $sum: { $cond: ["$is_active", 1, 0] } },
        },
      },
    ]);

    const topStocks = await Stock.find({ is_active: true })
      .sort({ current_price: -1 })
      .limit(5)
      .lean();

    const recentTransactions = await Transaction.find({})
      .sort({ transaction_time: -1 })
      .limit(10)
      .lean();

    return res.json({
      data: {
        market_overview: overview || {
          total_market_capitalization: 0,
          average_market_price: 0,
          active_stocks: 0,
        },
        top_stocks: topStocks,
        recent_transactions: recentTransactions,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: normalizeError(error) });
  }
});

app.use(express.static(distPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.sendFile(path.join(distPath, "index.html"));
});

async function start() {
  await connectDatabase();
  await ensureCollectionsAndIndexes();

  app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
    console.log(`Mongo database: ${config.mongoDbName}`);
  });
}

start().catch((error) => {
  console.error("Failed to start API:", error);
  process.exit(1);
});
