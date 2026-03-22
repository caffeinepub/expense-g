import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Page = "dashboard" | "transactions" | "budgets";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  userName: string;
}

const NAV_ITEMS: { label: string; page: Page }[] = [
  { label: "Dashboard", page: "dashboard" },
  { label: "Transactions", page: "transactions" },
  { label: "Budgets", page: "budgets" },
];

export default function Header({
  currentPage,
  onNavigate,
  userName,
}: HeaderProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
      <div className="max-w-[1160px] mx-auto px-6 h-16 flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">E</span>
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            Expense-G
          </span>
        </div>

        {/* Nav */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map(({ label, page }) => (
            <button
              type="button"
              key={page}
              data-ocid={`nav.${page}.link`}
              onClick={() => onNavigate(page)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
                currentPage === page
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {label}
              {currentPage === page && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            data-ocid="header.bell.button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" size={18} />
          </button>

          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              {userName}
            </span>
          </div>

          <Button
            data-ocid="header.logout.button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground gap-1.5 text-sm"
          >
            <LogOut size={15} />
            <span className="hidden sm:block">Log Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
