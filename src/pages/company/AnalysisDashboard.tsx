import { useEffect, useState } from "react";
import { analysisApi } from "@/lib/api";

export default function AnalysisDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    analysisApi.dashboard().then((response) => setData(response.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analysis Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-2">Market Overview</h2>
          <p className="text-sm text-muted-foreground">Total capitalization across all stocks.</p>
          <p className="text-3xl font-mono font-bold mt-3">${Number(data?.market_overview?.total_market_capitalization || 0).toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-2">Recent Transactions</h2>
          <div className="space-y-2 mt-3">
            {(data?.recent_transactions || []).slice(0, 5).map((transaction: any) => (
              <div key={transaction.transaction_id} className="flex items-center justify-between text-sm rounded-md border border-border/50 px-3 py-2">
                <span>{transaction.stock_symbol} {transaction.transaction_type}</span>
                <span className="font-mono">${Number(transaction.total_value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="glass-card p-5">
        <h2 className="font-semibold mb-3">Top 5 Stocks</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Name</th>
                <th className="pb-2 text-right">Current Price</th>
                <th className="pb-2 text-right">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {(data?.top_stocks || []).map((stock: any) => (
                <tr key={stock.stock_id} className="border-t border-border/50">
                  <td className="py-2">{stock.symbol}</td>
                  <td className="py-2">{stock.name}</td>
                  <td className="py-2 text-right font-mono">${Number(stock.current_price).toLocaleString()}</td>
                  <td className="py-2 text-right font-mono">${Number(stock.market_cap).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
