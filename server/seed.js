import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { connectDatabase, ensureCollectionsAndIndexes } from "./db.js";
import { Company, Investor, Stock, Transaction } from "./models.js";

const PASSWORD = "12345678";
const sectors = ["Technology", "Finance", "Healthcare", "Energy", "Consumer", "Industrial", "Telecom", "Automotive"];
const industries = {
  Technology: ["Cloud Software", "Semiconductors"],
  Finance: ["Banking", "Asset Management"],
  Healthcare: ["Biotech", "Medical Devices"],
  Energy: ["Oil & Gas", "Renewable Energy"],
  Consumer: ["Retail", "Consumer Electronics"],
  Industrial: ["Logistics", "Manufacturing"],
  Telecom: ["Wireless Services", "Network Infrastructure"],
  Automotive: ["EV Manufacturing", "Auto Components"],
};
const exchanges = ["NASDAQ", "NYSE", "NSE", "BSE"];
const cities = ["New York", "San Francisco", "Austin", "Chicago", "Boston", "Seattle", "Mumbai", "Bengaluru"];
const firms = ["Goldman Analytics", "Morgan Equity", "Beacon Research", "Northstar Capital"];

function randomFrom(list, index) {
  return list[index % list.length];
}

function companySymbol(index) {
  return `CMP${String(index).padStart(2, "0")}`;
}

function stockSymbol(companyIndex, stockIndex) {
  return `${companySymbol(companyIndex)}${String(stockIndex).padStart(2, "0")}`;
}

function buildPriceHistory(basePrice, volume, offset) {
  return Array.from({ length: 7 }, (_, idx) => {
    const dayOffset = 6 - idx;
    const open = Number((basePrice - 3 + idx * 0.9 + offset * 0.1).toFixed(2));
    const close = Number((open + 0.5 + ((idx + offset) % 3) * 0.45).toFixed(2));
    return {
      date: new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000),
      open,
      high: Number((Math.max(open, close) + 1.1).toFixed(2)),
      low: Number((Math.min(open, close) - 0.8).toFixed(2)),
      close,
      volume: volume + idx * 2500,
    };
  });
}

function buildAnalystRatings(basePrice, offset) {
  return firms.map((firm, idx) => ({
    firm,
    analyst: `Analyst ${offset + idx + 1}`,
    rating: ["Strong Buy", "Buy", "Hold", "Buy"][idx % 4],
    target_price: Number((basePrice * (1.08 + idx * 0.03)).toFixed(2)),
    date: new Date(Date.now() - idx * 5 * 24 * 60 * 60 * 1000),
  }));
}

function buildCompany(index, passwordHash) {
  const sector = randomFrom(sectors, index - 1);
  const exchange = randomFrom(exchanges, index - 1);
  const industry = randomFrom(industries[sector], index);
  return {
    company_id: uuidv4(),
    email: `company${index}@gmail.com`,
    password_hash: passwordHash,
    name: `Company ${index} Holdings`,
    symbol: companySymbol(index),
    sector,
    industry,
    exchange,
    founded_year: 1990 + index,
    market_cap: 2500000000 + index * 145000000,
    website: `https://www.company${index}.com`,
    headquarters: `${randomFrom(cities, index - 1)}, ${index % 2 === 0 ? "USA" : "India"}`,
    executives: [
      { name: `CEO ${index}`, title: "Chief Executive Officer", email: `ceo${index}@company${index}.com`, phone: `+1-555-100${index}` },
      { name: `CFO ${index}`, title: "Chief Financial Officer", email: `cfo${index}@company${index}.com`, phone: `+1-555-200${index}` },
    ],
    tags: [sector.toLowerCase(), industry.toLowerCase().replace(/\s+/g, "-"), exchange.toLowerCase()],
    verified: true,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function buildInvestor(index, passwordHash) {
  return {
    investor_id: uuidv4(),
    email: `investor${index}@gmail.com`,
    password_hash: passwordHash,
    name: `Investor ${index}`,
    phone: `+1-404-555-${String(1000 + index).slice(-4)}`,
    account_balance: 150000 + index * 7000,
    risk_profile: ["Conservative", "Moderate", "Aggressive"][index % 3],
    address: {
      line1: `${100 + index} Market Street`,
      city: randomFrom(cities, index + 2),
      state: index % 2 === 0 ? "California" : "Maharashtra",
      postal_code: `${90000 + index}`,
      country: index % 2 === 0 ? "USA" : "India",
    },
    portfolio: [],
    watchlist: [],
    preferred_sectors: [randomFrom(sectors, index), randomFrom(sectors, index + 2)],
    verified: true,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function buildStock(company, companyIndex, stockIndex) {
  const basePrice = 45 + companyIndex * 9 + stockIndex * 2.75;
  const volume = 150000 + companyIndex * 6000 + stockIndex * 3200;
  const priceHistory = buildPriceHistory(basePrice, volume, stockIndex + companyIndex);
  const currentPrice = priceHistory[priceHistory.length - 1].close;
  return {
    stock_id: uuidv4(),
    symbol: stockSymbol(companyIndex, stockIndex),
    company_id: company.company_id,
    name: `${company.name} Series ${stockIndex}`,
    current_price: currentPrice,
    market_cap: Number((currentPrice * volume).toFixed(2)),
    pe_ratio: Number((15 + companyIndex * 0.8 + stockIndex * 0.35).toFixed(2)),
    dividend_yield: Number((1.1 + (stockIndex % 5) * 0.25).toFixed(2)),
    volume,
    currency: company.exchange === "NSE" || company.exchange === "BSE" ? "INR" : "USD",
    exchange: company.exchange,
    sector: company.sector,
    is_active: true,
    tags: [company.sector.toLowerCase(), `growth-${stockIndex}`, company.symbol.toLowerCase()],
    financials: {
      revenue: 500000000 + companyIndex * 35000000 + stockIndex * 4500000,
      net_income: 65000000 + companyIndex * 4200000 + stockIndex * 800000,
      eps: Number((2.5 + companyIndex * 0.18 + stockIndex * 0.09).toFixed(2)),
      quarter: `Q${((stockIndex - 1) % 4) + 1}`,
      fiscal_year: 2025,
    },
    exchange_info: {
      country: company.exchange === "NSE" || company.exchange === "BSE" ? "India" : "United States",
      timezone: company.exchange === "NSE" || company.exchange === "BSE" ? "Asia/Kolkata" : "America/New_York",
      trading_hours: company.exchange === "NSE" || company.exchange === "BSE" ? "09:15-15:30" : "09:30-16:00",
      board: stockIndex % 2 === 0 ? "Main Board" : "Growth Board",
    },
    price_history: priceHistory,
    analyst_ratings: buildAnalystRatings(currentPrice, companyIndex + stockIndex),
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function applyBuy(investor, stock, quantity, price, transactions) {
  const totalValue = Number((quantity * price).toFixed(2));
  const existing = investor.portfolio.find((item) => item.stock_symbol === stock.symbol);
  investor.account_balance = Number((investor.account_balance - totalValue).toFixed(2));

  if (existing) {
    existing.invested_value = Number((existing.invested_value + totalValue).toFixed(2));
    existing.quantity += quantity;
    existing.average_price = Number((existing.invested_value / existing.quantity).toFixed(2));
  } else {
    investor.portfolio.push({
      stock_id: stock.stock_id,
      stock_symbol: stock.symbol,
      company_id: stock.company_id,
      company_name: stock.name,
      quantity,
      average_price: price,
      invested_value: totalValue,
    });
  }

  transactions.push({
    transaction_id: uuidv4(),
    investor_id: investor.investor_id,
    stock_id: stock.stock_id,
    stock_symbol: stock.symbol,
    company_id: stock.company_id,
    quantity,
    price,
    total_value: totalValue,
    transaction_type: "BUY",
    status: "COMPLETED",
    order_details: { order_type: "MARKET", notes: "Seed buy order" },
    transaction_time: new Date(Date.now() - Math.floor(Math.random() * 12) * 24 * 60 * 60 * 1000),
    created_at: new Date(),
    updated_at: new Date(),
  });
}

function applySell(investor, stock, quantity, price, transactions) {
  const holding = investor.portfolio.find((item) => item.stock_symbol === stock.symbol);
  if (!holding || holding.quantity < quantity) return;

  const totalValue = Number((quantity * price).toFixed(2));
  const remainingQuantity = holding.quantity - quantity;
  investor.account_balance = Number((investor.account_balance + totalValue).toFixed(2));

  if (remainingQuantity === 0) {
    investor.portfolio = investor.portfolio.filter((item) => item.stock_symbol !== stock.symbol);
  } else {
    holding.quantity = remainingQuantity;
    holding.invested_value = Number((holding.average_price * remainingQuantity).toFixed(2));
  }

  transactions.push({
    transaction_id: uuidv4(),
    investor_id: investor.investor_id,
    stock_id: stock.stock_id,
    stock_symbol: stock.symbol,
    company_id: stock.company_id,
    quantity,
    price,
    total_value: totalValue,
    transaction_type: "SELL",
    status: "COMPLETED",
    order_details: { order_type: "MARKET", notes: "Seed sell order" },
    transaction_time: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000),
    created_at: new Date(),
    updated_at: new Date(),
  });
}

async function seed() {
  await connectDatabase();
  await ensureCollectionsAndIndexes();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await Promise.all([
    Transaction.deleteMany({}),
    Stock.deleteMany({}),
    Investor.deleteMany({}),
    Company.deleteMany({}),
  ]);

  const companies = Array.from({ length: 16 }, (_, idx) => buildCompany(idx + 1, passwordHash));
  const investors = Array.from({ length: 20 }, (_, idx) => buildInvestor(idx + 1, passwordHash));

  const stocks = companies.flatMap((company, companyIndex) =>
    Array.from({ length: 15 }, (_, stockIndex) => buildStock(company, companyIndex + 1, stockIndex + 1))
  );

  const transactions = [];
  investors.forEach((investor, investorIndex) => {
    const baseStock = stocks[(investorIndex * 7) % stocks.length];
    const secondStock = stocks[(investorIndex * 7 + 11) % stocks.length];
    const thirdStock = stocks[(investorIndex * 7 + 23) % stocks.length];

    applyBuy(investor, baseStock, 10 + (investorIndex % 5), baseStock.current_price, transactions);
    applyBuy(investor, secondStock, 6 + (investorIndex % 4), secondStock.current_price, transactions);
    applyBuy(investor, thirdStock, 4 + (investorIndex % 3), thirdStock.current_price, transactions);
    applySell(investor, baseStock, 2 + (investorIndex % 2), Number((baseStock.current_price * 1.04).toFixed(2)), transactions);

    investor.watchlist = [baseStock.symbol, secondStock.symbol, thirdStock.symbol];
    investor.updated_at = new Date();
  });

  await Company.insertMany(companies, { ordered: true });
  await Investor.insertMany(investors, { ordered: true });
  await Stock.insertMany(stocks, { ordered: true });
  await Transaction.insertMany(transactions, { ordered: true });

  console.log("Seed complete");
  console.log(`Companies inserted: ${companies.length}`);
  console.log(`Investors inserted: ${investors.length}`);
  console.log(`Stocks inserted: ${stocks.length}`);
  console.log(`Transactions inserted: ${transactions.length}`);
  console.log("Company emails: company1@gmail.com ... company16@gmail.com");
  console.log("Investor emails: investor1@gmail.com ... investor20@gmail.com");
  console.log(`Password for all seeded accounts: ${PASSWORD}`);
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
