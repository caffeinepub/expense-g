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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { Transaction } from "../backend.d";
import TransactionModal from "../components/TransactionModal";
import {
  useDeleteTransaction,
  useGetAllBudgetLimits,
  useGetRecentTransactions,
  useGetSpendingByCategory,
  useGetTotalBalance,
  useGetTotalExpensesForMonth,
} from "../hooks/useQueries";
import {
  formatCurrency,
  getCategoryIcon,
  nanoToDisplayDate,
} from "../lib/categories";

const CHART_COLORS = [
  "#2E6FB8",
  "#4BB071",
  "#3AA0A6",
  "#B8C0C7",
  "#E0925A",
  "#8B68D4",
];

function KPISkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-32" />
    </div>
  );
}

export default function DashboardPage({ userName }: { userName: string }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: balance, isLoading: balanceLoading } = useGetTotalBalance();
  const { data: spending, isLoading: spendingLoading } =
    useGetTotalExpensesForMonth(month, year);
  const { data: prevSpending } = useGetTotalExpensesForMonth(
    prevMonth,
    prevYear,
  );
  const { data: categoryData, isLoading: catLoading } =
    useGetSpendingByCategory(month, year);
  const { data: recentTxs, isLoading: txLoading } =
    useGetRecentTransactions(10);
  const { data: budgets } = useGetAllBudgetLimits();
  const deleteMutation = useDeleteTransaction();

  const spendingDelta = useMemo(() => {
    if (!spending || !prevSpending || prevSpending === 0) return null;
    return ((spending - prevSpending) / prevSpending) * 100;
  }, [spending, prevSpending]);

  const totalBudget = useMemo(
    () => (budgets ?? []).reduce((s, b) => s + b.amount, 0),
    [budgets],
  );
  const budgetUsedPct =
    totalBudget > 0 && spending
      ? Math.min((spending / totalBudget) * 100, 100)
      : 0;

  const pieData = useMemo(
    () =>
      (categoryData ?? [])
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value })),
    [categoryData],
  );

  // Build daily spending trend from recent transactions
  const trendData = useMemo(() => {
    const txs = recentTxs ?? [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayMap: Record<number, number> = {};
    for (const tx of txs) {
      const d = new Date(Number(tx.date) / 1_000_000);
      if (
        d.getMonth() + 1 === month &&
        d.getFullYear() === year &&
        tx.transactionType === "expense"
      ) {
        const day = d.getDate();
        dayMap[day] = (dayMap[day] ?? 0) + tx.amount;
      }
    }
    return Array.from({ length: Math.min(daysInMonth, 30) }, (_, i) => ({
      day: i + 1,
      amount: dayMap[i + 1] ?? 0,
    }));
  }, [recentTxs, month, year]);

  const topCategory = useMemo(() => {
    if (!categoryData || categoryData.length === 0) return null;
    return [...categoryData].sort((a, b) => b[1] - a[1])[0];
  }, [categoryData]);

  const monthName = now.toLocaleString("default", { month: "long" });

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete");
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
        {/* Welcome heading */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          Welcome Back, {userName.split(" ")[0]}!
        </h1>

        {/* KPI Card */}
        <Card className="mb-5 shadow-card border-border">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border gap-6 sm:gap-0">
              {/* Total Balance */}
              <div className="sm:pr-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Balance
                </p>
                {balanceLoading ? (
                  <KPISkeleton />
                ) : (
                  <p
                    className="text-2xl font-bold text-foreground"
                    data-ocid="kpi.balance.card"
                  >
                    {formatCurrency(balance ?? 0)}
                  </p>
                )}
              </div>
              {/* Monthly Spending */}
              <div className="sm:px-6 pt-6 sm:pt-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {monthName} Spending
                </p>
                {spendingLoading ? (
                  <KPISkeleton />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(spending ?? 0)}
                    </p>
                    {spendingDelta !== null && (
                      <Badge
                        className={`text-xs font-medium flex items-center gap-0.5 ${
                          spendingDelta > 0
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-success-bg text-success border-green-100"
                        }`}
                        variant="outline"
                        data-ocid="kpi.spending_delta.badge"
                      >
                        {spendingDelta > 0 ? (
                          <TrendingUp size={11} />
                        ) : (
                          <TrendingDown size={11} />
                        )}
                        {Math.abs(spendingDelta).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {/* Budget Progress */}
              <div className="sm:pl-6 pt-6 sm:pt-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Budget Progress
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(spending ?? 0)} /{" "}
                    {formatCurrency(totalBudget)}
                  </span>
                </div>
                <Progress
                  value={budgetUsedPct}
                  className="h-2"
                  data-ocid="kpi.budget_progress.card"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {totalBudget > 0
                    ? `${budgetUsedPct.toFixed(0)}% of monthly budget used`
                    : "No budget set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* Donut Chart */}
          <Card className="shadow-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Spending by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {catLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : pieData.length === 0 ? (
                <div
                  className="h-40 flex items-center justify-center"
                  data-ocid="spending_chart.empty_state"
                >
                  <p className="text-sm text-muted-foreground">
                    No spending data
                  </p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((d2, i) => (
                          <Cell
                            key={d2.name}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {pieData.slice(0, 4).map((d, i) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-muted-foreground flex-1 truncate">
                          {d.name}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(d.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Trend Chart */}
          <Card className="shadow-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Daily Spending — {monthName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={trendData}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#2C8A87"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2C8A87"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EA" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "#6B7785" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#6B7785" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `Rs.${v}`}
                    />
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      labelFormatter={(l) => `Day ${l}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#2C8A87"
                      strokeWidth={2}
                      fill="url(#tealGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Category List */}
          <Card className="shadow-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Top Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {catLoading ? (
                ["sk1", "sk2", "sk3", "sk4"].map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))
              ) : pieData.length === 0 ? (
                <div
                  className="py-6 text-center"
                  data-ocid="categories.empty_state"
                >
                  <p className="text-sm text-muted-foreground">
                    No categories yet
                  </p>
                </div>
              ) : (
                pieData.slice(0, 5).map((d, i) => {
                  const Icon = getCategoryIcon(d.name);
                  const pct = spending
                    ? Math.min((d.value / spending) * 100, 100)
                    : 0;
                  return (
                    <div key={d.name}>
                      <div className="flex items-center gap-2.5 mb-1">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: `${CHART_COLORS[i % CHART_COLORS.length]}20`,
                          }}
                        >
                          <Icon
                            size={13}
                            style={{
                              color: CHART_COLORS[i % CHART_COLORS.length],
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium flex-1 truncate">
                          {d.name}
                        </span>
                        <span className="text-xs font-semibold">
                          {formatCurrency(d.value)}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="mb-5 shadow-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Recent Transactions
            </CardTitle>
            <Button
              size="sm"
              data-ocid="transactions.add_button"
              onClick={() => {
                setEditingTx(null);
                setModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus size={14} />
              Add Transaction
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div
                className="p-6 space-y-3"
                data-ocid="transactions.loading_state"
              >
                {["sk1", "sk2", "sk3", "sk4", "sk5"].map((k) => (
                  <Skeleton key={k} className="h-12 w-full" />
                ))}
              </div>
            ) : !recentTxs || recentTxs.length === 0 ? (
              <div
                className="py-12 text-center"
                data-ocid="transactions.empty_state"
              >
                <p className="text-muted-foreground">No transactions yet.</p>
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
                  Add your first transaction
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
                      <TableHead className="text-xs text-right">
                        Amount
                      </TableHead>
                      <TableHead className="text-xs text-right pr-6">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTxs.map((tx, idx) => (
                      <TableRow
                        key={tx.id}
                        data-ocid={`transactions.item.${idx + 1}`}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <TableCell className="pl-6 text-sm text-muted-foreground py-3">
                          {nanoToDisplayDate(tx.date)}
                        </TableCell>
                        <TableCell className="text-sm font-medium py-3">
                          {tx.description}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                            {tx.category}
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

        {/* Quick Stats */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Top Spending Category
              </p>
              {topCategory ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{topCategory[0]}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(topCategory[1])}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">
                {monthName} Summary
              </p>
              <p className="text-sm font-semibold">
                {spending !== undefined ? formatCurrency(spending) : "—"} spent
              </p>
              {budgets && budgets.length > 0 && totalBudget > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalBudget > (spending ?? 0)
                    ? `${formatCurrency(totalBudget - (spending ?? 0))} remaining`
                    : `${formatCurrency((spending ?? 0) - totalBudget)} over budget`}
                </p>
              )}
            </div>
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
              This action cannot be undone. The transaction will be permanently
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
