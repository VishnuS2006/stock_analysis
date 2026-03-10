import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import {
  authApi,
  clearToken,
  setStoredRole,
  setToken,
  type AppRole,
  type AppUser,
  type CompanyAccount,
  type InvestorAccount,
} from "@/lib/api";

interface AuthContextType {
  user: AppUser | null;
  role: AppRole | null;
  loading: boolean;
  company: CompanyAccount | null;
  investor: InvestorAccount | null;
  signUp: (role: AppRole, payload: Record<string, unknown>) => Promise<void>;
  signIn: (role: AppRole, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [company, setCompany] = useState<CompanyAccount | null>(null);
  const [investor, setInvestor] = useState<InvestorAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = (data: {
    token: string;
    user: AppUser;
    role: AppRole;
    company: CompanyAccount | null;
    investor: InvestorAccount | null;
  }) => {
    setToken(data.token);
    setStoredRole(data.role);
    setUser(data.user);
    setRole(data.role);
    setCompany(data.company);
    setInvestor(data.investor);
  };

  const refresh = async () => {
    const data = await authApi.me();
    applyAuth(data);
  };

  useEffect(() => {
    authApi
      .me()
      .then((data) => applyAuth(data))
      .catch(() => {
        clearToken();
        setUser(null);
        setRole(null);
        setCompany(null);
        setInvestor(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signUp = async (accountRole: AppRole, payload: Record<string, unknown>) => {
    const data =
      accountRole === "company"
        ? await authApi.companySignUp(payload)
        : await authApi.investorSignUp(payload);
    applyAuth(data);
  };

  const signIn = async (accountRole: AppRole, email: string, password: string) => {
    const data =
      accountRole === "company"
        ? await authApi.companyLogin({ email, password })
        : await authApi.investorLogin({ email, password });
    applyAuth(data);
  };

  const signOut = async () => {
    clearToken();
    setUser(null);
    setRole(null);
    setCompany(null);
    setInvestor(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, company, investor, signUp, signIn, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
