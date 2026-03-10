import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  TrendingUp,
  LayoutDashboard,
  Package,
  BarChart3,
  Search,
  Briefcase,
  ArrowLeftRight,
  LogOut,
  Building2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const companyLinks = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Add Stock", url: "/dashboard/stocks", icon: Package },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Transactions", url: "/dashboard/transactions", icon: ArrowLeftRight },
  { title: "Analysis", url: "/dashboard/analysis-dashboard", icon: Briefcase },
];

const investorLinks = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Browse Stocks", url: "/dashboard/browse", icon: Search },
  { title: "Portfolio", url: "/dashboard/portfolio", icon: Briefcase },
  { title: "Transactions", url: "/dashboard/transactions", icon: ArrowLeftRight },
  { title: "Analytics", url: "/dashboard/analysis", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { role, company, investor, signOut } = useAuth();
  const navigate = useNavigate();
  const links = role === "company" ? companyLinks : investorLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const accountName = role === "company" ? company?.name : investor?.name;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="w-72 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-primary" />
            <div>
              <p className="text-lg font-bold">StockVista</p>
              <p className="text-xs text-muted-foreground">MongoDB Market Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.url}
              to={link.url}
              end={link.url === "/dashboard"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              activeClassName="bg-sidebar-accent text-primary font-medium"
            >
              <link.icon className="h-4 w-4" />
              <span>{link.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
              {role === "company" ? <Building2 className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{accountName || "Account"}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
