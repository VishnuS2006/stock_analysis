import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { Company, Investor } from "./models.js";

export function createToken(account) {
  const payload = {
    id: account.company_id || account.investor_id,
    email: account.email,
    role: account.company_id ? "company" : "investor",
  };

  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    req.auth = jwt.verify(token, config.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

export async function getAuthenticatedAccount(auth) {
  if (!auth) return null;
  if (auth.role === "company") {
    const company = await Company.findOne({ company_id: auth.id }).lean();
    return company ? { role: "company", account: company } : null;
  }

  const investor = await Investor.findOne({ investor_id: auth.id }).lean();
  return investor ? { role: "investor", account: investor } : null;
}
