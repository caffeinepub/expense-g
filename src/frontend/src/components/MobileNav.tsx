import { ArrowLeftRight, LayoutDashboard, PieChart } from "lucide-react";

type Page = "dashboard" | "transactions" | "budgets";

interface MobileNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { label: string; page: Page; icon: React.ElementType }[] = [
  { label: "Dashboard", page: "dashboard", icon: LayoutDashboard },
  { label: "Transactions", page: "transactions", icon: ArrowLeftRight },
  { label: "Budgets", page: "budgets", icon: PieChart },
];

export default function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-card border-t border-border"
      aria-label="Mobile navigation"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {NAV_ITEMS.map(({ label, page, icon: Icon }) => (
        <button
          key={page}
          type="button"
          data-ocid={`mobile_nav.${page}.link`}
          onClick={() => onNavigate(page)}
          className={`flex flex-1 flex-col items-center justify-center gap-1 min-h-14 transition-colors ${
            currentPage === page
              ? "text-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-current={currentPage === page ? "page" : undefined}
        >
          <Icon size={20} strokeWidth={currentPage === page ? 2.5 : 1.8} />
          <span className="text-xs font-medium">{label}</span>
          {currentPage === page && (
            <span
              className="absolute top-0 left-0 right-0 h-0.5 bg-accent rounded-full"
              style={{
                position: "relative",
                width: "32px",
                height: "2px",
                borderRadius: "9999px",
                background: "hsl(var(--accent))",
              }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
