import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BudgetLimit {
    category: string;
    amount: number;
}
export interface UserProfile {
    name: string;
}
export interface Transaction {
    id: string;
    created: bigint;
    transactionType: TransactionType;
    date: bigint;
    description: string;
    category: string;
    amount: number;
}
export enum TransactionType {
    expense = "expense",
    income = "income"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTransaction(transaction: Transaction): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteTransaction(transactionId: string): Promise<boolean>;
    getAllBudgetLimits(): Promise<Array<BudgetLimit>>;
    getBudgetLimit(category: string): Promise<number | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<string>>;
    getRecentTransactions(limit: bigint): Promise<Array<Transaction>>;
    getSpendingByCategory(month: bigint, year: bigint): Promise<Array<[string, number]>>;
    getTotalBalance(): Promise<number>;
    getTotalExpensesForMonth(month: bigint, year: bigint): Promise<number>;
    getTotalIncomeForMonth(month: bigint, year: bigint): Promise<number>;
    getTransactions(): Promise<Array<Transaction>>;
    getTransactionsByCategory(category: string): Promise<Array<Transaction>>;
    getTransactionsByType(transactionType: TransactionType): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setBudgetLimit(category: string, amount: number): Promise<void>;
    updateTransaction(transactionId: string, updatedTransaction: Transaction): Promise<boolean>;
}
