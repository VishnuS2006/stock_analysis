import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Building2, UserRound, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type AppRole = "company" | "investor";

const defaultCompany = {
  name: "",
  symbol: "",
  sector: "",
  industry: "",
  exchange: "NASDAQ",
  founded_year: "",
  market_cap: "",
  website: "",
  headquarters: "",
  executives: '[{"name":"Executive 1","title":"Chief Executive Officer","email":"ceo@company.com","phone":"+1-555-0000"}]',
  tags: "",
  verified: true,
};

const defaultInvestor = {
  name: "",
  phone: "",
  account_balance: "100000",
  risk_profile: "Moderate",
  address: '{"line1":"1 Wall Street","city":"New York","state":"NY","postal_code":"10005","country":"USA"}',
  preferred_sectors: "Technology, Finance",
  watchlist: "",
  verified: true,
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<AppRole>("investor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyForm, setCompanyForm] = useState(defaultCompany);
  const [investorForm, setInvestorForm] = useState(defaultInvestor);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signIn(role, email, password);
      toast.success(`${role === "company" ? "Company" : "Investor"} logged in`);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (role === "company") {
        await signUp("company", {
          email,
          password,
          ...companyForm,
        });
      } else {
        await signUp("investor", {
          email,
          password,
          ...investorForm,
        });
      }
      toast.success(`${role === "company" ? "Company" : "Investor"} account created`);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr] bg-background">
      <section className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-primary/10 via-background to-stock-blue/10">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-3">
            <TrendingUp className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">StockVista</h1>
          </div>
          <p className="text-2xl leading-relaxed text-muted-foreground">
            MongoDB-backed stock market analysis for listed companies and active investors.
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="glass-card p-4">
              <p className="font-mono text-2xl font-bold text-primary">16+</p>
              <p className="text-muted-foreground">Companies</p>
            </div>
            <div className="glass-card p-4">
              <p className="font-mono text-2xl font-bold text-stock-green">240+</p>
              <p className="text-muted-foreground">Stocks</p>
            </div>
            <div className="glass-card p-4">
              <p className="font-mono text-2xl font-bold text-stock-blue">20+</p>
              <p className="text-muted-foreground">Investors</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-10">
        <Card className="w-full max-w-2xl border-border/50 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Access Portal</CardTitle>
            <CardDescription>Separate login and signup flows for companies and investors.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setRole("investor")}
                  className={`rounded-lg border p-4 text-left ${role === "investor" ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  <UserRound className="h-5 w-5 mb-2" />
                  <p className="font-semibold">Investor</p>
                  <p className="text-sm text-muted-foreground">Trade, sell, track portfolio</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("company")}
                  className={`rounded-lg border p-4 text-left ${role === "company" ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  <Building2 className="h-5 w-5 mb-2" />
                  <p className="font-semibold">Company</p>
                  <p className="text-sm text-muted-foreground">List stocks and monitor trading</p>
                </button>
              </div>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Authenticating..." : `Login as ${role}`} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>

                  {role === "company" ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><Label>Name</Label><Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Symbol</Label><Input value={companyForm.symbol} onChange={(e) => setCompanyForm({ ...companyForm, symbol: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Sector</Label><Input value={companyForm.sector} onChange={(e) => setCompanyForm({ ...companyForm, sector: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Industry</Label><Input value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Exchange</Label><Input value={companyForm.exchange} onChange={(e) => setCompanyForm({ ...companyForm, exchange: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Founded Year</Label><Input value={companyForm.founded_year} onChange={(e) => setCompanyForm({ ...companyForm, founded_year: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Market Cap</Label><Input value={companyForm.market_cap} onChange={(e) => setCompanyForm({ ...companyForm, market_cap: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Website</Label><Input value={companyForm.website} onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })} required /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Headquarters</Label><Input value={companyForm.headquarters} onChange={(e) => setCompanyForm({ ...companyForm, headquarters: e.target.value })} required /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Executives JSON</Label><Input value={companyForm.executives} onChange={(e) => setCompanyForm({ ...companyForm, executives: e.target.value })} required /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Tags</Label><Input value={companyForm.tags} onChange={(e) => setCompanyForm({ ...companyForm, tags: e.target.value })} /></div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><Label>Name</Label><Input value={investorForm.name} onChange={(e) => setInvestorForm({ ...investorForm, name: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Phone</Label><Input value={investorForm.phone} onChange={(e) => setInvestorForm({ ...investorForm, phone: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Account Balance</Label><Input value={investorForm.account_balance} onChange={(e) => setInvestorForm({ ...investorForm, account_balance: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Risk Profile</Label><Input value={investorForm.risk_profile} onChange={(e) => setInvestorForm({ ...investorForm, risk_profile: e.target.value })} required /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Address JSON</Label><Input value={investorForm.address} onChange={(e) => setInvestorForm({ ...investorForm, address: e.target.value })} required /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Preferred Sectors</Label><Input value={investorForm.preferred_sectors} onChange={(e) => setInvestorForm({ ...investorForm, preferred_sectors: e.target.value })} /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Initial Watchlist</Label><Input value={investorForm.watchlist} onChange={(e) => setInvestorForm({ ...investorForm, watchlist: e.target.value })} /></div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : `Create ${role} account`} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
