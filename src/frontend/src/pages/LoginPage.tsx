import { Button } from "@/components/ui/button";
import { Loader2, PieChart, Shield, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-card">
            <span className="text-primary-foreground text-2xl font-bold">
              E
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Expense-G</h1>
          <p className="mt-2 text-muted-foreground">
            Your personal finance companion
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-card p-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Sign in to continue
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Use Internet Identity for secure, passwordless authentication.
          </p>

          <Button
            data-ocid="login.primary_button"
            className="w-full h-11 text-base"
            onClick={() => login()}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              "Sign In with Internet Identity"
            )}
          </Button>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-border space-y-3">
            {[
              {
                icon: TrendingUp,
                text: "Track expenses and income effortlessly",
              },
              {
                icon: PieChart,
                text: "Visualize spending with beautiful charts",
              },
              {
                icon: Shield,
                text: "Secure & private on the Internet Computer",
              },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Expense-G · Built with{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
