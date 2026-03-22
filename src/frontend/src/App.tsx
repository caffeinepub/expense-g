import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import BudgetsPage from "./pages/BudgetsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import TransactionsPage from "./pages/TransactionsPage";

type Page = "dashboard" | "transactions" | "budgets";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  const userName = userProfile?.name ?? "User";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        userName={userName}
      />

      <div className="flex-1 pb-16 md:pb-0">
        {currentPage === "dashboard" && <DashboardPage userName={userName} />}
        {currentPage === "transactions" && <TransactionsPage />}
        {currentPage === "budgets" && <BudgetsPage />}
      </div>

      <Footer />
      <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />
      <Toaster />
      <ProfileSetupModal open={showProfileSetup} />
    </div>
  );
}
