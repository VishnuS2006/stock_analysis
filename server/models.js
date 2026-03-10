import mongoose from "mongoose";

const executiveSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false, versionKey: false }
);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    postal_code: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
  },
  { _id: false, versionKey: false }
);

const portfolioItemSchema = new mongoose.Schema(
  {
    stock_id: { type: String, required: true, trim: true },
    stock_symbol: { type: String, required: true, trim: true },
    company_id: { type: String, required: true, trim: true },
    company_name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    average_price: { type: Number, required: true, min: 0 },
    invested_value: { type: Number, required: true, min: 0 },
  },
  { _id: false, versionKey: false }
);

const priceHistorySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    open: { type: Number, required: true, min: 0 },
    high: { type: Number, required: true, min: 0 },
    low: { type: Number, required: true, min: 0 },
    close: { type: Number, required: true, min: 0 },
    volume: { type: Number, required: true, min: 0 },
  },
  { _id: false, versionKey: false }
);

const analystRatingSchema = new mongoose.Schema(
  {
    firm: { type: String, required: true, trim: true },
    analyst: { type: String, required: true, trim: true },
    rating: { type: String, required: true, enum: ["Strong Buy", "Buy", "Hold", "Sell"] },
    target_price: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
  },
  { _id: false, versionKey: false }
);

const financialsSchema = new mongoose.Schema(
  {
    revenue: { type: Number, required: true, min: 0 },
    net_income: { type: Number, required: true },
    eps: { type: Number, required: true },
    quarter: { type: String, required: true, trim: true },
    fiscal_year: { type: Number, required: true },
  },
  { _id: false, versionKey: false }
);

const exchangeInfoSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true },
    timezone: { type: String, required: true, trim: true },
    trading_hours: { type: String, required: true, trim: true },
    board: { type: String, required: true, trim: true },
  },
  { _id: false, versionKey: false }
);

const companySchema = new mongoose.Schema(
  {
    company_id: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    sector: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    exchange: { type: String, required: true, trim: true },
    founded_year: { type: Number, required: true },
    market_cap: { type: Number, required: true, min: 0 },
    website: { type: String, required: true, trim: true },
    headquarters: { type: String, required: true, trim: true },
    executives: { type: [executiveSchema], default: [], validate: [(value) => value.length > 0, "At least one executive is required"] },
    tags: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "company", versionKey: false }
);

const investorSchema = new mongoose.Schema(
  {
    investor_id: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    account_balance: { type: Number, required: true, min: 0 },
    risk_profile: { type: String, required: true, enum: ["Conservative", "Moderate", "Aggressive"] },
    address: { type: addressSchema, required: true },
    portfolio: { type: [portfolioItemSchema], default: [] },
    watchlist: { type: [String], default: [] },
    preferred_sectors: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "investor", versionKey: false }
);

const stockSchema = new mongoose.Schema(
  {
    stock_id: { type: String, required: true, unique: true, index: true, trim: true },
    symbol: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    company_id: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    current_price: { type: Number, required: true, min: 0 },
    market_cap: { type: Number, required: true, min: 0 },
    pe_ratio: { type: Number, required: true, min: 0 },
    dividend_yield: { type: Number, required: true, min: 0 },
    volume: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true },
    exchange: { type: String, required: true, trim: true },
    sector: { type: String, required: true, trim: true },
    is_active: { type: Boolean, required: true, default: true },
    tags: { type: [String], default: [] },
    financials: { type: financialsSchema, required: true },
    exchange_info: { type: exchangeInfoSchema, required: true },
    price_history: { type: [priceHistorySchema], default: [], validate: [(value) => value.length > 0, "Price history is required"] },
    analyst_ratings: { type: [analystRatingSchema], default: [], validate: [(value) => value.length > 0, "Analyst ratings are required"] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "stock", versionKey: false }
);

const transactionSchema = new mongoose.Schema(
  {
    transaction_id: { type: String, required: true, unique: true, index: true, trim: true },
    investor_id: { type: String, required: true, index: true, trim: true },
    stock_id: { type: String, required: true, index: true, trim: true },
    stock_symbol: { type: String, required: true, index: true, uppercase: true, trim: true },
    company_id: { type: String, required: true, index: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total_value: { type: Number, required: true, min: 0 },
    transaction_type: { type: String, required: true, enum: ["BUY", "SELL"] },
    status: { type: String, required: true, enum: ["PENDING", "COMPLETED", "FAILED"], default: "COMPLETED" },
    order_details: {
      type: new mongoose.Schema(
        {
          order_type: { type: String, required: true, enum: ["MARKET", "LIMIT"] },
          notes: { type: String, trim: true, default: "" },
        },
        { _id: false, versionKey: false }
      ),
      required: true,
    },
    transaction_time: { type: Date, required: true, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "transaction", versionKey: false }
);

function touchUpdatedAt(next) {
  this.updated_at = new Date();
  next();
}

companySchema.pre("save", touchUpdatedAt);
investorSchema.pre("save", touchUpdatedAt);
stockSchema.pre("save", touchUpdatedAt);
transactionSchema.pre("save", touchUpdatedAt);

export const Company = mongoose.model("Company", companySchema);
export const Investor = mongoose.model("Investor", investorSchema);
export const Stock = mongoose.model("Stock", stockSchema);
export const Transaction = mongoose.model("Transaction", transactionSchema);
export { priceHistorySchema, analystRatingSchema, financialsSchema };
