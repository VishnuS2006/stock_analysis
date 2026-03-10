import { useEffect, useState } from "react";
import { analysisApi } from "@/lib/api";
import { Trophy } from "lucide-react";

export default function ProfitAnalysis() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    analysisApi.dashboard().then((response) => setData(response.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6 text-primary" /> Market Snapshot</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">Total Market Cap</p>
          <p className="text-2xl font-mono font-bold">${Number(data?.market_overview?.total_market_capitalization || 0).toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">Average Price</p>
          <p className="text-2xl font-mono font-bold">${Number(data?.market_overview?.average_market_price || 0).toFixed(2)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">Active Stocks</p>
          <p className="text-2xl font-mono font-bold">{Number(data?.market_overview?.active_stocks || 0).toLocaleString()}</p>
        </div>
      </div>
      <div className="glass-card p-5">
        <h2 className="font-semibold mb-3">Top Stocks</h2>
        <div className="space-y-2">
          {(data?.top_stocks || []).map((stock: any) => (
            <div key={stock.stock_id} className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
              <span>{stock.symbol} - {stock.name}</span>
              <span className="font-mono">${Number(stock.current_price).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
