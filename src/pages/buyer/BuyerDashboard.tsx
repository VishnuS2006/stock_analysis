import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { transactionApi } from "@/lib/api";
import StatCard from "@/components/StatCard";
import { Wallet, ShoppingCart, TrendingDown, Activity } from "lucide-react";

export default function BuyerDashboard() {
  const { investor } = useAuth();
  const [stats, setStats] = useState({ totalOrders: 0, buys: 0, sells: 0, totalValue: 0 });

  useEffect(() => {
    if (!investor) return;

    transactionApi.list({ investor_id: investor.investor_id }).then((response) => {
      const transactions = response.data || [];
      setStats({
        totalOrders: transactions.length,
        buys: transactions.filter((item) => item.transaction_type === "BUY").length,
        sells: transactions.filter((item) => item.transaction_type === "SELL").length,
        totalValue: transactions.reduce((sum, item) => sum + item.total_value, 0),
      });
    });
  }, [investor]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Investor Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Account Balance" value={`$${Number(investor?.account_balance || 0).toLocaleString()}`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Total Orders" value={String(stats.totalOrders)} icon={<Activity className="h-5 w-5" />} />
        <StatCard title="Buy Orders" value={String(stats.buys)} icon={<ShoppingCart className="h-5 w-5" />} trend="up" />
        <StatCard title="Sell Orders" value={String(stats.sells)} icon={<TrendingDown className="h-5 w-5" />} />
      </div>
      <div className="glass-card p-5 mt-6">
        <h2 className="font-semibold mb-3">Preferred Sectors</h2>
        <div className="flex flex-wrap gap-2">
          {(investor?.preferred_sectors || []).map((sector) => (
            <span key={sector} className="rounded-full border border-border px-3 py-1 text-sm">{sector}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
