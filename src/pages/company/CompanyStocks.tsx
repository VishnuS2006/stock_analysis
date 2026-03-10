import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { type StockRecord, stockApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

type StockForm = Record<keyof StockRecord, string>;

const emptyForm: StockForm = {
  stock_id: "",
  symbol: "",
  company_id: "",
  name: "",
  current_price: "",
  market_cap: "",
  pe_ratio: "",
  dividend_yield: "",
  volume: "",
  currency: "USD",
  exchange: "NASDAQ",
  sector: "",
  is_active: "true",
  tags: "[]",
  financials: '{"revenue":0,"net_income":0,"eps":0,"quarter":"Q1","fiscal_year":2025}',
  exchange_info: '{"country":"United States","timezone":"America/New_York","trading_hours":"09:30-16:00","board":"Main Board"}',
  price_history: '[{"date":"2026-03-10T00:00:00.000Z","open":100,"high":105,"low":98,"close":104,"volume":100000}]',
  analyst_ratings: '[{"firm":"Beacon Research","analyst":"Lead Analyst","rating":"Buy","target_price":110,"date":"2026-03-10T00:00:00.000Z"}]',
  created_at: "",
  updated_at: "",
};

const stockFields: Array<{ key: keyof StockRecord; label: string; type?: string }> = [
  { key: "stock_id", label: "1. stock_id" },
  { key: "symbol", label: "2. symbol" },
  { key: "company_id", label: "3. company_id" },
  { key: "name", label: "4. name" },
  { key: "current_price", label: "5. current_price", type: "number" },
  { key: "market_cap", label: "6. market_cap", type: "number" },
  { key: "pe_ratio", label: "7. pe_ratio", type: "number" },
  { key: "dividend_yield", label: "8. dividend_yield", type: "number" },
  { key: "volume", label: "9. volume", type: "number" },
  { key: "currency", label: "10. currency" },
  { key: "exchange", label: "11. exchange" },
  { key: "sector", label: "12. sector" },
  { key: "is_active", label: "13. is_active" },
  { key: "tags", label: "14. tags (JSON array)" },
  { key: "financials", label: "15. financials (JSON)" },
  { key: "exchange_info", label: "16. exchange_info (JSON)" },
  { key: "price_history", label: "17. price_history (JSON array)" },
  { key: "analyst_ratings", label: "18. analyst_ratings (JSON array)" },
  { key: "created_at", label: "19. created_at (optional ISO date)" },
  { key: "updated_at", label: "20. updated_at (optional ISO date)" },
];

function stringifyValue(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function parseForm(form: StockForm, companyId: string) {
  return {
    stock_id: form.stock_id.trim(),
    symbol: form.symbol.trim().toUpperCase(),
    company_id: companyId,
    name: form.name.trim(),
    current_price: Number(form.current_price),
    market_cap: Number(form.market_cap),
    pe_ratio: Number(form.pe_ratio),
    dividend_yield: Number(form.dividend_yield),
    volume: Number(form.volume),
    currency: form.currency.trim().toUpperCase(),
    exchange: form.exchange.trim(),
    sector: form.sector.trim(),
    is_active: form.is_active === "true",
    tags: JSON.parse(form.tags || "[]"),
    financials: JSON.parse(form.financials),
    exchange_info: JSON.parse(form.exchange_info),
    price_history: JSON.parse(form.price_history),
    analyst_ratings: JSON.parse(form.analyst_ratings),
    created_at: form.created_at || undefined,
    updated_at: form.updated_at || undefined,
  };
}

export default function CompanyStocks() {
  const { company } = useAuth();
  const [stocks, setStocks] = useState<StockRecord[]>([]);
  const [form, setForm] = useState<StockForm>(emptyForm);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => {
    if (!company) return;
    const response = await stockApi.list({ company_id: company.company_id });
    setStocks(response.data);
  };

  useEffect(() => {
    load();
  }, [company?.company_id]);

  useEffect(() => {
    if (!company) return;
    setForm((current) => ({
      ...current,
      company_id: current.company_id || company.company_id,
      exchange: current.exchange || company.exchange,
      sector: current.sector || company.sector,
    }));
  }, [company]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company) return;

    try {
      const payload = parseForm(form, company.company_id);
      if (editId) {
        await stockApi.update(editId, payload);
        toast.success("Stock updated");
      } else {
        await stockApi.create(payload);
        toast.success("Stock created");
      }
      setOpen(false);
      setEditId(null);
      setForm({ ...emptyForm, company_id: company.company_id, exchange: company.exchange, sector: company.sector });
      await load();
    } catch (error: any) {
      toast.error(error.message || "Unable to save stock");
    }
  };

  const handleEdit = (stock: StockRecord) => {
    setEditId(stock.stock_id);
    setForm(
      Object.fromEntries(
        Object.entries(stock).map(([key, value]) => [key, stringifyValue(value)])
      ) as StockForm
    );
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Stocks</h1>
        <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm((current) => ({ ...emptyForm, company_id: company?.company_id || "", exchange: company?.exchange || "NASDAQ", sector: company?.sector || "" }))}><Plus className="mr-2 h-4 w-4" /> Add Stock</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Stock" : "Add Stock"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              {stockFields.map((field) => (
                <div key={field.key} className={`space-y-2 ${field.key === "price_history" || field.key === "analyst_ratings" || field.key === "financials" || field.key === "exchange_info" ? "md:col-span-2" : ""}`}>
                  <Label>{field.label}</Label>
                  <Input
                    type={field.type || "text"}
                    value={form[field.key]}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                    required={!(["created_at", "updated_at"].includes(field.key))}
                    readOnly={field.key === "company_id" && !editId}
                  />
                </div>
              ))}
              <Button type="submit" className="md:col-span-2">{editId ? "Update Stock" : "Create Stock"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No stocks listed yet.</TableCell>
              </TableRow>
            ) : (
              stocks.map((stock) => (
                <TableRow key={stock.stock_id}>
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell className="text-right font-mono">{stock.current_price.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{stock.volume.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(stock)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
