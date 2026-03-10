export type AppRole = "company" | "investor";

export interface AppUser {
  id: string;
  email: string;
  role: AppRole;
  name: string;
}

export interface CompanyAccount {
  company_id: string;
  email: string;
  name: string;
  symbol: string;
  sector: string;
  industry: string;
  exchange: string;
  founded_year: number;
  market_cap: number;
  website: string;
  headquarters: string;
  executives: Array<{ name: string; title: string; email?: string; phone?: string }>;
  tags: string[];
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestorAccount {
  investor_id: string;
  email: string;
  name: string;
  phone: string;
  account_balance: number;
  risk_profile: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  portfolio: Array<{
    stock_id: string;
    stock_symbol: string;
    company_id: string;
    company_name: string;
    quantity: number;
    average_price: number;
    invested_value: number;
  }>;
  watchlist: string[];
  preferred_sectors: string[];
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  role: AppRole;
  user: AppUser;
  company: CompanyAccount | null;
  investor: InvestorAccount | null;
}

export interface StockRecord {
  stock_id: string;
  symbol: string;
  company_id: string;
  name: string;
  current_price: number;
  market_cap: number;
  pe_ratio: number;
  dividend_yield: number;
  volume: number;
  currency: string;
  exchange: string;
  sector: string;
  is_active: boolean;
  tags: string[];
  financials: {
    revenue: number;
    net_income: number;
    eps: number;
    quarter: string;
    fiscal_year: number;
  };
  exchange_info: {
    country: string;
    timezone: string;
    trading_hours: string;
    board: string;
  };
  price_history: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  analyst_ratings: Array<{
    firm: string;
    analyst: string;
    rating: string;
    target_price: number;
    date: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface TransactionRecord {
  transaction_id: string;
  investor_id: string;
  stock_id: string;
  stock_symbol: string;
  company_id: string;
  quantity: number;
  price: number;
  total_value: number;
  transaction_type: "BUY" | "SELL";
  status: string;
  order_details: { order_type: string; notes: string };
  transaction_time: string;
  created_at: string;
  updated_at: string;
}

const TOKEN_KEY = "stock_watcher_token";
const ROLE_KEY = "stock_watcher_role";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function setStoredRole(role: AppRole) {
  localStorage.setItem(ROLE_KEY, role);
}

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY) as AppRole | null;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, requiresAuth = false): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const authApi = {
  companySignUp: (payload: Record<string, unknown>) =>
    request<AuthResponse>("/auth/company/signup", { method: "POST", body: JSON.stringify(payload) }),
  companyLogin: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/company/login", { method: "POST", body: JSON.stringify(payload) }),
  investorSignUp: (payload: Record<string, unknown>) =>
    request<AuthResponse>("/auth/investor/signup", { method: "POST", body: JSON.stringify(payload) }),
  investorLogin: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/investor/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<AuthResponse>("/auth/me", {}, true),
};

export const companyApi = {
  list: () => request<{ data: CompanyAccount[] }>("/companies"),
};

export const investorApi = {
  list: () => request<{ data: InvestorAccount[] }>("/investors", {}, true),
  portfolio: () => request<{ data: InvestorAccount["portfolio"]; account_balance: number }>("/portfolio", {}, true),
  addToWatchlist: (symbol: string) =>
    request<{ data: string[] }>("/investors/watchlist", { method: "POST", body: JSON.stringify({ symbol }) }, true),
};

export const stockApi = {
  list: (params?: { company_id?: string; symbol?: string; stock_id?: string; is_active?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.company_id) query.set("company_id", params.company_id);
    if (params?.symbol) query.set("symbol", params.symbol);
    if (params?.stock_id) query.set("stock_id", params.stock_id);
    if (params?.is_active) query.set("is_active", "true");
    return request<{ data: StockRecord[] }>(`/stocks${query.toString() ? `?${query.toString()}` : ""}`);
  },
  create: (payload: Partial<StockRecord>) =>
    request<{ data: StockRecord }>("/stocks", { method: "POST", body: JSON.stringify(payload) }, true),
  update: (stockId: string, payload: Partial<StockRecord>) =>
    request<{ data: StockRecord }>(`/stocks/${stockId}`, { method: "PATCH", body: JSON.stringify(payload) }, true),
};

export const transactionApi = {
  list: (params?: { investor_id?: string; company_id?: string; stock_symbol?: string }) => {
    const query = new URLSearchParams();
    if (params?.investor_id) query.set("investor_id", params.investor_id);
    if (params?.company_id) query.set("company_id", params.company_id);
    if (params?.stock_symbol) query.set("stock_symbol", params.stock_symbol);
    return request<{ data: TransactionRecord[] }>(`/transactions${query.toString() ? `?${query.toString()}` : ""}`, {}, true);
  },
  create: (payload: {
    stock_symbol: string;
    quantity: number;
    price?: number;
    transaction_type: "BUY" | "SELL";
    status?: string;
    order_details?: { order_type: string; notes: string };
  }) => request<{ data: TransactionRecord; portfolio: InvestorAccount["portfolio"]; account_balance: number }>(
    "/transactions",
    { method: "POST", body: JSON.stringify(payload) },
    true
  ),
};

export const analysisApi = {
  dashboard: () => request<{ data: any }>("/analysis/dashboard", {}, true),
};
