import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { stockApi, transactionApi } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";

export default function CompanyAnalytics() {
  const { company } = useAuth();
  const [priceData, setPriceData] = useState<any[]>([]);
  const [transactionData, setTransactionData] = useState<any[]>([]);

  useEffect(() => {
    if (!company) return;

    Promise.all([
      stockApi.list({ company_id: company.company_id }),
      transactionApi.list({ company_id: company.company_id }),
    ]).then(([stockResponse, transactionResponse]) => {
      setPriceData(stockResponse.data.map((stock) => ({ symbol: stock.symbol, price: stock.current_price, volume: stock.volume })));

      const grouped: Record<string, number> = {};
      transactionResponse.data.forEach((transaction) => {
        const day = new Date(transaction.transaction_time).toLocaleDateString();
        grouped[day] = (grouped[day] || 0) + transaction.total_value;
      });
      setTransactionData(Object.entries(grouped).map(([date, total]) => ({ date, total })));
    });
  }, [company]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Company Analytics</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4">Price by Symbol</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,16%)" />
              <XAxis dataKey="symbol" stroke="hsl(215,12%,50%)" fontSize={12} />
              <YAxis stroke="hsl(215,12%,50%)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="price" fill="hsl(217,91%,60%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4">Transaction Value Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,16%)" />
              <XAxis dataKey="date" stroke="hsl(215,12%,50%)" fontSize={12} />
              <YAxis stroke="hsl(215,12%,50%)" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="hsl(142,70%,45%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
