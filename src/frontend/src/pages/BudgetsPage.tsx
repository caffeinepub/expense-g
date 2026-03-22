import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Pencil, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetAllBudgetLimits,
  useGetSpendingByCategory,
  useGetTotalExpensesForMonth,
  useSetBudgetLimit,
} from "../hooks/useQueries";
import {
  formatCurrency,
  getAllCategories,
  getCategoryIcon,
  saveCustomCategory,
} from "../lib/categories";

const CHART_COLORS = [
  "#2E6FB8",
  "#4BB071",
  "#3AA0A6",
  "#B8C0C7",
  "#E0925A",
  "#8B68D4",
];

export default function BudgetsPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthName = now.toLocaleString("default", { month: "long" });

  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(getAllCategories()[0]);
  const [editAmount, setEditAmount] = useState("");
  const [allCategories, setAllCategories] = useState<string[]>(
    getAllCategories(),
  );
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const { data: budgets, isLoading: budgetsLoading } = useGetAllBudgetLimits();
  const { data: spending } = useGetTotalExpensesForMonth(month, year);
  const { data: categorySpending } = useGetSpendingByCategory(month, year);
  const setBudgetMutation = useSetBudgetLimit();

  const spendingMap = Object.fromEntries(categorySpending ?? []);
  const totalBudget = (budgets ?? []).reduce((s, b) => s + b.amount, 0);

  const openEdit = (category: string, amount: number) => {
    setEditCategory(category);
    setEditAmount(String(amount));
    setShowCustomInput(false);
    setCustomCategoryInput("");
    setAllCategories(getAllCategories());
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditCategory(getAllCategories()[0]);
    setEditAmount("");
    setShowCustomInput(false);
    setCustomCategoryInput("");
    setAllCategories(getAllCategories());
    setModalOpen(true);
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    saveCustomCategory(trimmed);
    const updated = getAllCategories();
    setAllCategories(updated);
    setEditCategory(trimmed);
    setShowCustomInput(false);
    setCustomCategoryInput("");
    toast.success(`Category "${trimmed}" added`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(editAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    try {
      await setBudgetMutation.mutateAsync({ category: editCategory, amount });
      toast.success(`Budget set for ${editCategory}`);
      setModalOpen(false);
    } catch {
      toast.error("Failed to save budget");
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monthly budget limits for {monthName} {year}
            </p>
          </div>
          <Button
            data-ocid="budgets.add_button"
            onClick={openAdd}
            className="gap-1.5"
          >
            <Plus size={15} />
            Set Budget
          </Button>
        </div>

        {/* Overview card */}
        {totalBudget > 0 && (
          <Card className="mb-5 shadow-card border-border">
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Budget
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(totalBudget)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Spent This Month
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(spending ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Remaining
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      (spending ?? 0) > totalBudget
                        ? "text-destructive"
                        : "text-success"
                    }`}
                  >
                    {formatCurrency(Math.abs(totalBudget - (spending ?? 0)))}
                    {(spending ?? 0) > totalBudget ? " over" : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Overall progress</span>
                  <span>
                    {totalBudget > 0
                      ? `${Math.min(((spending ?? 0) / totalBudget) * 100, 100).toFixed(0)}%`
                      : "0%"}
                  </span>
                </div>
                <Progress
                  value={
                    totalBudget > 0
                      ? Math.min(((spending ?? 0) / totalBudget) * 100, 100)
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget categories */}
        {budgetsLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="budgets.loading_state"
          >
            {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((k) => (
              <Skeleton key={k} className="h-36" />
            ))}
          </div>
        ) : !budgets || budgets.length === 0 ? (
          <Card className="shadow-card border-border">
            <CardContent
              className="py-16 text-center"
              data-ocid="budgets.empty_state"
            >
              <p className="text-muted-foreground mb-4">No budgets set yet.</p>
              <Button
                variant="outline"
                onClick={openAdd}
                data-ocid="budgets.empty_add_button"
                className="gap-1.5"
              >
                <Plus size={14} />
                Set your first budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget, idx) => {
              const spent = spendingMap[budget.category] ?? 0;
              const pct = Math.min((spent / budget.amount) * 100, 100);
              const over = spent > budget.amount;
              const Icon = getCategoryIcon(budget.category);
              const color = CHART_COLORS[idx % CHART_COLORS.length];

              return (
                <Card
                  key={budget.category}
                  data-ocid={`budgets.item.${idx + 1}`}
                  className="shadow-card border-border hover:shadow-card-hover transition-shadow"
                >
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: `${color}20` }}
                      >
                        <Icon size={16} style={{ color }} />
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        {budget.category}
                      </CardTitle>
                    </div>
                    <button
                      type="button"
                      data-ocid={`budgets.edit_button.${idx + 1}`}
                      onClick={() => openEdit(budget.category, budget.amount)}
                      className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-secondary transition-colors"
                      aria-label="Edit budget"
                    >
                      <Pencil size={13} />
                    </button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold">
                          {formatCurrency(spent)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          spent
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        of {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className="h-2"
                      style={
                        over
                          ? ({
                              "--progress-foreground":
                                "oklch(var(--destructive))",
                            } as any)
                          : {}
                      }
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`text-xs font-medium ${
                          over ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {pct.toFixed(0)}% used
                      </span>
                      {over ? (
                        <span className="text-xs text-destructive font-medium">
                          +{formatCurrency(spent - budget.amount)} over
                        </span>
                      ) : (
                        <span className="text-xs text-success">
                          {formatCurrency(budget.amount - spent)} left
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      <Dialog open={modalOpen} onOpenChange={(v) => !v && setModalOpen(false)}>
        <DialogContent className="sm:max-w-sm" data-ocid="budget.dialog">
          <DialogHeader>
            <DialogTitle>Set Budget Limit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger data-ocid="budget.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
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
            <div className="space-y-2">
              <Label htmlFor="budget-amount">Monthly Limit (Rs.)</Label>
              <Input
                id="budget-amount"
                data-ocid="budget.input"
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 5000"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="budget.cancel_button"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="budget.submit_button"
                disabled={setBudgetMutation.isPending}
              >
                {setBudgetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Budget"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
