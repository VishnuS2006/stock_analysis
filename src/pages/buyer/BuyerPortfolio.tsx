import { useEffect, useState } from "react";
import { investorApi, stockApi, transactionApi, type StockRecord, type TransactionRecord } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BuyerPortfolio() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, StockRecord>>({});
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const portfolioResponse = await investorApi.portfolio();
      setPortfolio(portfolioResponse.data);

      const stockResponses = await Promise.all(
        (portfolioResponse.data || []).map((item) => stockApi.list({ symbol: item.stock_symbol }))
      );

      const nextStockMap: Record<string, StockRecord> = {};
      stockResponses.forEach((response) => {
        response.data.forEach((stock) => {
          nextStockMap[stock.symbol] = stock;
        });
      });
      setStockMap(nextStockMap);

      const transactionResponse = await transactionApi.list();
      setTransactions(transactionResponse.data);
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Portfolio</h1>
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Average Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Invested Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolio.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No holdings yet.</TableCell></TableRow>
              ) : portfolio.map((item) => (
                <TableRow key={item.stock_symbol}>
                  <TableCell className="font-medium">{item.stock_symbol}</TableCell>
                  <TableCell>{item.company_name}</TableCell>
                  <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono">${item.average_price.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${Number(stockMap[item.stock_symbol]?.current_price || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${item.invested_value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No transactions yet.</TableCell></TableRow>
              ) : transactions.map((transaction) => (
                <TableRow key={transaction.transaction_id}>
                  <TableCell>{transaction.transaction_type}</TableCell>
                  <TableCell>{transaction.stock_symbol}</TableCell>
                  <TableCell className="text-right font-mono">{transaction.quantity}</TableCell>
                  <TableCell className="text-right font-mono">${transaction.price.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${transaction.total_value.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{new Date(transaction.transaction_time).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
