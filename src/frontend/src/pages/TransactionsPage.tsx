import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Transaction } from "../backend.d";
import TransactionModal from "../components/TransactionModal";
import { useDeleteTransaction, useGetTransactions } from "../hooks/useQueries";
import {
  formatCurrency,
  getAllCategories,
  nanoToDisplayDate,
} from "../lib/categories";

const MONTHS = [
  "All Months",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function TransactionsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("All Months");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const { data: transactions, isLoading } = useGetTransactions();
  const deleteMutation = useDeleteTransaction();
  const allCategories = getAllCategories();

  const filtered = useMemo(() => {
    let txs = transactions ?? [];

    if (search.trim()) {
      const q = search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }

    if (filterMonth !== "All Months") {
      const monthIdx = MONTHS.indexOf(filterMonth);
      txs = txs.filter((t) => {
        const d = new Date(Number(t.date) / 1_000_000);
        return d.getMonth() + 1 === monthIdx;
      });
    }

    if (filterCategory !== "all") {
      txs = txs.filter((t) => t.category === filterCategory);
    }

    if (filterType !== "all") {
      txs = txs.filter((t) => t.transactionType === filterType);
    }

    return [...txs].sort((a, b) => Number(b.date - a.date));
  }, [transactions, search, filterMonth, filterCategory, filterType]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete transaction");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="max-w-[1160px] mx-auto px-4 md:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <Button
            data-ocid="transactions.add_button"
            onClick={() => {
              setEditingTx(null);
              setModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus size={15} />
            Add Transaction
          </Button>
        </div>

        <Card className="shadow-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Filters
            </CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  data-ocid="transactions.search_input"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger
                  data-ocid="transactions.month.select"
                  className="h-9 text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger
                  data-ocid="transactions.category.select"
                  className="h-9 text-sm"
                >
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger
                  data-ocid="transactions.type.select"
                  className="h-9 text-sm"
                >
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div
                className="p-6 space-y-3"
                data-ocid="transactions.loading_state"
              >
                {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((k) => (
                  <Skeleton key={k} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="py-16 text-center"
                data-ocid="transactions.empty_state"
              >
                <p className="text-muted-foreground">No transactions found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setEditingTx(null);
                    setModalOpen(true);
                  }}
                  data-ocid="transactions.empty_add_button"
                >
                  Add Transaction
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="transactions.table">
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="pl-6 text-xs">Date</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs text-right">
                        Amount
                      </TableHead>
                      <TableHead className="text-xs text-right pr-6">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((tx, idx) => (
                      <TableRow
                        key={tx.id}
                        data-ocid={`transactions.item.${idx + 1}`}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <TableCell className="pl-6 text-sm text-muted-foreground py-3">
                          {nanoToDisplayDate(tx.date)}
                        </TableCell>
                        <TableCell className="text-sm font-medium py-3 max-w-[200px] truncate">
                          {tx.description}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                            {tx.category}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              tx.transactionType === "income"
                                ? "bg-success-bg text-success"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {tx.transactionType}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-sm font-semibold text-right py-3 ${
                            tx.transactionType === "income"
                              ? "text-success"
                              : "text-foreground"
                          }`}
                        >
                          {tx.transactionType === "income" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="text-right pr-6 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              data-ocid={`transactions.edit_button.${idx + 1}`}
                              onClick={() => {
                                setEditingTx(tx);
                                setModalOpen(true);
                              }}
                              className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-secondary transition-colors"
                              aria-label="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              data-ocid={`transactions.delete_button.${idx + 1}`}
                              onClick={() => setDeletingId(tx.id)}
                              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                              aria-label="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTx(null);
        }}
        editingTransaction={editingTx}
      />

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
      >
        <AlertDialogContent data-ocid="delete_transaction.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The transaction will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="delete_transaction.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="delete_transaction.confirm_button"
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
