import { useEffect, useMemo, useState } from "react";
import { companyApi, investorApi, stockApi, transactionApi, type CompanyAccount, type StockRecord } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ShoppingCart, TrendingDown, Star } from "lucide-react";
import { toast } from "sonner";

export default function BrowseStocks() {
  const { refresh, investor } = useAuth();
  const [stocks, setStocks] = useState<StockRecord[]>([]);
  const [companies, setCompanies] = useState<Record<string, CompanyAccount>>({});
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockRecord | null>(null);
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("1");

  const load = async () => {
    const [stockResponse, companyResponse] = await Promise.all([stockApi.list({ is_active: true }), companyApi.list()]);
    setStocks(stockResponse.data);
    setCompanies(Object.fromEntries(companyResponse.data.map((company) => [company.company_id, company])));
  };

  useEffect(() => {
    load();
  }, []);

  const holdingsMap = useMemo(() => Object.fromEntries((investor?.portfolio || []).map((item) => [item.stock_symbol, item])), [investor]);

  const filtered = stocks.filter((stock) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const companyName = companies[stock.company_id]?.name?.toLowerCase() || "";
    return stock.symbol.toLowerCase().includes(query) || stock.name.toLowerCase().includes(query) || companyName.includes(query);
  });

  const submitOrder = async () => {
    if (!selectedStock) return;
    try {
      await transactionApi.create({
        stock_symbol: selectedStock.symbol,
        quantity: Number(quantity),
        price: selectedStock.current_price,
        transaction_type: action,
        order_details: { order_type: "MARKET", notes: `${action} from dashboard` },
      });
      await refresh();
      await load();
      toast.success(`${action} order completed for ${selectedStock.symbol}`);
      setSelectedStock(null);
      setQuantity("1");
    } catch (error: any) {
      toast.error(error.message || `${action} failed`);
    }
  };

  const addWatchlist = async (symbol: string) => {
    try {
      await investorApi.addToWatchlist(symbol);
      await refresh();
      toast.success(`${symbol} added to watchlist`);
    } catch (error: any) {
      toast.error(error.message || "Unable to update watchlist");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stock Marketplace</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search stocks or companies" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((stock) => {
          const holding = holdingsMap[stock.symbol];
          return (
            <div key={stock.stock_id} className="glass-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                  <h3 className="text-lg font-semibold">{stock.name}</h3>
                  <p className="text-sm text-muted-foreground">{companies[stock.company_id]?.name || "Unknown Company"}</p>
                </div>
                <button type="button" onClick={() => addWatchlist(stock.symbol)} className="text-muted-foreground hover:text-primary">
                  <Star className={`h-5 w-5 ${(investor?.watchlist || []).includes(stock.symbol) ? "fill-current text-primary" : ""}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Price</p>
                  <p className="font-mono text-xl font-bold">${stock.current_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dividend Yield</p>
                  <p className="font-mono">{stock.dividend_yield}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">P/E Ratio</p>
                  <p className="font-mono">{stock.pe_ratio}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Holding</p>
                  <p className="font-mono">{holding?.quantity || 0} shares</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => { setSelectedStock(stock); setAction("BUY"); }}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Buy
                </Button>
                <Button variant="outline" onClick={() => { setSelectedStock(stock); setAction("SELL"); }} disabled={!holding}>
                  <TrendingDown className="mr-2 h-4 w-4" /> Sell
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedStock} onOpenChange={(value) => { if (!value) setSelectedStock(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action} {selectedStock?.symbol}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="glass-card p-4 text-sm space-y-2">
              <div className="flex justify-between"><span>Price</span><span className="font-mono">${selectedStock?.current_price.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Available Holding</span><span className="font-mono">{selectedStock ? holdingsMap[selectedStock.symbol]?.quantity || 0 : 0}</span></div>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <Button className="w-full" onClick={submitOrder}>{action} Shares</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
