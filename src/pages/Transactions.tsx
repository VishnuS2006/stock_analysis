import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { transactionApi, type TransactionRecord } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function TransactionsPage() {
  const { role, company, investor } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await transactionApi.list(
        role === "company" && company
          ? { company_id: company.company_id }
          : investor
            ? { investor_id: investor.investor_id }
            : undefined
      );
      setTransactions(response.data);
    };

    load();
  }, [role, company?.company_id, investor?.investor_id]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stock</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No transactions available.</TableCell></TableRow>
            ) : transactions.map((transaction) => (
              <TableRow key={transaction.transaction_id}>
                <TableCell>{transaction.stock_symbol}</TableCell>
                <TableCell>{transaction.transaction_type}</TableCell>
                <TableCell className="text-right font-mono">{transaction.quantity}</TableCell>
                <TableCell className="text-right font-mono">${transaction.price.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono">${transaction.total_value.toLocaleString()}</TableCell>
                <TableCell>{transaction.status}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{new Date(transaction.transaction_time).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
