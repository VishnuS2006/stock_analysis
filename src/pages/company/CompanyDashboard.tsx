import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { stockApi, transactionApi } from "@/lib/api";
import StatCard from "@/components/StatCard";
import { Package, ArrowUpRight, DollarSign, Activity } from "lucide-react";

export default function CompanyDashboard() {
  const { company } = useAuth();
  const [stats, setStats] = useState({ totalStocks: 0, totalTransactions: 0, turnover: 0, averagePrice: 0 });

  useEffect(() => {
    if (!company) return;

    Promise.all([
      stockApi.list({ company_id: company.company_id }),
      transactionApi.list({ company_id: company.company_id }),
    ]).then(([stockResponse, transactionResponse]) => {
      const stocks = stockResponse.data || [];
      const transactions = transactionResponse.data || [];
      const turnover = transactions.reduce((sum, item) => sum + item.total_value, 0);
      const averagePrice = stocks.length
        ? stocks.reduce((sum, item) => sum + item.current_price, 0) / stocks.length
        : 0;

      setStats({
        totalStocks: stocks.length,
        totalTransactions: transactions.length,
        turnover,
        averagePrice,
      });
    });
  }, [company]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Company Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Listed Stocks" value={String(stats.totalStocks)} icon={<Package className="h-5 w-5" />} />
        <StatCard title="Transactions" value={String(stats.totalTransactions)} icon={<ArrowUpRight className="h-5 w-5" />} trend="up" />
        <StatCard title="Turnover" value={`$${stats.turnover.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} trend="up" />
        <StatCard title="Average Price" value={`$${stats.averagePrice.toFixed(2)}`} icon={<Activity className="h-5 w-5" />} />
      </div>
    </div>
  );
}
