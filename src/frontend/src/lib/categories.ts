import {
  BookOpen,
  Briefcase,
  Car,
  Heart,
  Home,
  MoreHorizontal,
  Music,
  Plane,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Healthcare",
  "Utilities",
  "Housing",
  "Travel",
  "Education",
  "Income",
  "Business",
  "Other",
];

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Food & Dining": UtensilsCrossed,
  Shopping: ShoppingBag,
  Transportation: Car,
  Entertainment: Music,
  Healthcare: Heart,
  Utilities: Zap,
  Housing: Home,
  Travel: Plane,
  Education: BookOpen,
  Income: TrendingUp,
  Business: Briefcase,
  Other: MoreHorizontal,
};

export const CATEGORY_COLORS = [
  "oklch(0.485 0.13 248)",
  "oklch(0.65 0.13 155)",
  "oklch(0.625 0.09 198)",
  "oklch(0.775 0.01 240)",
  "oklch(0.72 0.15 55)",
  "oklch(0.627 0.265 303)",
  "oklch(0.704 0.191 22)",
  "oklch(0.756 0.14 90)",
  "oklch(0.6 0.118 184)",
  "oklch(0.55 0.2 330)",
  "oklch(0.5 0.15 270)",
  "oklch(0.7 0.1 165)",
];

export const getCategoryIcon = (category: string): LucideIcon => {
  return CATEGORY_ICONS[category] ?? MoreHorizontal;
};

export const getCategoryColor = (category: string): string => {
  const idx = CATEGORIES.indexOf(category);
  return CATEGORY_COLORS[idx >= 0 ? idx : CATEGORY_COLORS.length - 1];
};

export const dateStringToNano = (dateStr: string): bigint => {
  return BigInt(new Date(`${dateStr}T12:00:00`).getTime()) * BigInt(1_000_000);
};

export const nanoToDateString = (nano: bigint): string => {
  const date = new Date(Number(nano) / 1_000_000);
  return date.toISOString().split("T")[0];
};

export const nanoToDisplayDate = (nano: bigint): string => {
  return new Date(Number(nano) / 1_000_000).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatCurrency = (amount: number): string => {
  return `Rs. ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

// Custom categories stored in localStorage
const CUSTOM_CAT_KEY = "expense_g_custom_categories";

export function getCustomCategories(): string[] {
  try {
    const stored = localStorage.getItem(CUSTOM_CAT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCustomCategory(cat: string): void {
  const existing = getCustomCategories();
  const trimmed = cat.trim();
  if (trimmed && !existing.includes(trimmed) && !CATEGORIES.includes(trimmed)) {
    localStorage.setItem(
      CUSTOM_CAT_KEY,
      JSON.stringify([...existing, trimmed]),
    );
  }
}

export function getAllCategories(): string[] {
  return [...CATEGORIES, ...getCustomCategories()];
}
