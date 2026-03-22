import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BudgetLimit, Transaction, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRecentTransactions(limit: number) {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["recentTransactions", limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentTransactions(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["totalBalance"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getTotalBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalExpensesForMonth(month: number, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["totalExpenses", month, year],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getTotalExpensesForMonth(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalIncomeForMonth(month: number, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["totalIncome", month, year],
    enabled: !!actor && !isFetching,
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getTotalIncomeForMonth(BigInt(month), BigInt(year));
    },
  });
}

export function useGetSpendingByCategory(month: number, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, number]>>({
    queryKey: ["spendingByCategory", month, year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSpendingByCategory(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllBudgetLimits() {
  const { actor, isFetching } = useActor();
  return useQuery<BudgetLimit[]>({
    queryKey: ["budgetLimits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBudgetLimits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: Transaction) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addTransaction(transaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["totalBalance"] });
      queryClient.invalidateQueries({ queryKey: ["totalExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["totalIncome"] });
      queryClient.invalidateQueries({ queryKey: ["spendingByCategory"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      transaction,
    }: { id: string; transaction: Transaction }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateTransaction(id, transaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["totalBalance"] });
      queryClient.invalidateQueries({ queryKey: ["totalExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["totalIncome"] });
      queryClient.invalidateQueries({ queryKey: ["spendingByCategory"] });
    },
  });
}

export function useDeleteTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transactionId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteTransaction(transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["totalBalance"] });
      queryClient.invalidateQueries({ queryKey: ["totalExpenses"] });
      queryClient.invalidateQueries({ queryKey: ["totalIncome"] });
      queryClient.invalidateQueries({ queryKey: ["spendingByCategory"] });
    },
  });
}

export function useSetBudgetLimit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      category,
      amount,
    }: { category: string; amount: number }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setBudgetLimit(category, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetLimits"] });
    },
  });
}
