import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Transaction } from "../backend.d";
import { useAddTransaction, useUpdateTransaction } from "../hooks/useQueries";
import {
  CATEGORIES,
  dateStringToNano,
  getAllCategories,
  nanoToDateString,
  saveCustomCategory,
} from "../lib/categories";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

type FormState = {
  description: string;
  amount: string;
  category: string;
  date: string;
  type: "expense" | "income";
};

const defaultForm = (): FormState => ({
  description: "",
  amount: "",
  category: "Food & Dining",
  date: new Date().toISOString().split("T")[0],
  type: "expense",
});

export default function TransactionModal({
  open,
  onClose,
  editingTransaction,
}: TransactionModalProps) {
  const [form, setForm] = useState<FormState>(defaultForm());
  const [allCategories, setAllCategories] = useState<string[]>(
    getAllCategories(),
  );
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const addMutation = useAddTransaction();
  const updateMutation = useUpdateTransaction();

  // biome-ignore lint/correctness/useExhaustiveDependencies: open resets form intentionally
  useEffect(() => {
    if (editingTransaction) {
      setForm({
        description: editingTransaction.description,
        amount: String(editingTransaction.amount),
        category: editingTransaction.category,
        date: nanoToDateString(editingTransaction.date),
        type: editingTransaction.transactionType as "expense" | "income",
      });
    } else {
      setForm(defaultForm());
    }
    setShowCustomInput(false);
    setCustomCategoryInput("");
    setAllCategories(getAllCategories());
  }, [editingTransaction, open]);

  const isPending = addMutation.isPending || updateMutation.isPending;

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    saveCustomCategory(trimmed);
    const updated = getAllCategories();
    setAllCategories(updated);
    setForm((prev) => ({ ...prev, category: trimmed }));
    setShowCustomInput(false);
    setCustomCategoryInput("");
    toast.success(`Category "${trimmed}" added`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0) return;

    const transaction: Transaction = {
      id: editingTransaction?.id ?? crypto.randomUUID(),
      created:
        editingTransaction?.created ?? BigInt(Date.now()) * BigInt(1_000_000),
      date: dateStringToNano(form.date),
      description: form.description,
      category: form.category,
      amount,
      transactionType: form.type as any,
    };

    try {
      if (editingTransaction) {
        await updateMutation.mutateAsync({
          id: editingTransaction.id,
          transaction,
        });
        toast.success("Transaction updated");
      } else {
        await addMutation.mutateAsync(transaction);
        toast.success("Transaction added");
      }
      onClose();
    } catch {
      toast.error("Failed to save transaction");
    }
  };

  const set = (field: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="transaction.dialog">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Type toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                data-ocid={`transaction.${t}.toggle`}
                onClick={() => set("type")(t)}
                className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                  form.type === t
                    ? t === "expense"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-description">Description</Label>
            <Input
              id="tx-description"
              data-ocid="transaction.input"
              placeholder="e.g. Grocery shopping"
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Amount (Rs.)</Label>
              <Input
                id="tx-amount"
                data-ocid="transaction.amount.input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => set("amount")(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                data-ocid="transaction.date.input"
                type="date"
                value={form.date}
                onChange={(e) => set("date")(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={set("category")}>
              <SelectTrigger data-ocid="transaction.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <div className="px-2 py-1 border-t border-border mt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomInput((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium w-full py-1"
                  >
                    <Plus size={12} />
                    Add custom category
                  </button>
                </div>
              </SelectContent>
            </Select>

            {showCustomInput && (
              <div className="flex gap-2">
                <Input
                  placeholder="Custom category name"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomCategory();
                    }
                  }}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-3"
                  onClick={handleAddCustomCategory}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="transaction.cancel_button"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="transaction.submit_button"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingTransaction ? (
                "Update"
              ) : (
                "Add Transaction"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
