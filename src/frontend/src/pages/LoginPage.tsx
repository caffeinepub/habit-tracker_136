import { Button } from "@/components/ui/button";
import { Activity, Loader2, Sparkles, Target, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FEATURES = [
  {
    icon: Target,
    text: "Track daily habits with ease",
    bg: "#FFB3C620",
    iconBg: "#FFB3C650",
    color: "#d4607a",
  },
  {
    icon: TrendingUp,
    text: "Visual progress charts & streaks",
    bg: "#B5EAD720",
    iconBg: "#B5EAD750",
    color: "#2d8a62",
  },
  {
    icon: Sparkles,
    text: "Share your progress with friends",
    bg: "#C7B8EA20",
    iconBg: "#C7B8EA50",
    color: "#7c5cbf",
  },
];

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl card-shadow p-8 md:p-10 space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #C7B8EA 0%, #AEC6CF 50%, #B5EAD7 100%)",
              }}
            >
              <Activity className="w-9 h-9 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">
                Habit Tracker
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Build better habits, one day at a time 🌱
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: f.bg }}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: f.iconBg }}
                >
                  <f.icon className="w-4 h-4" style={{ color: f.color }} />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {f.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Login button */}
          <Button
            data-ocid="login.primary_button"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full h-12 rounded-2xl text-base font-bold bg-foreground text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              "Sign In to Continue →"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Secure login via Internet Identity. Your session stays active.
          </p>
        </div>
      </motion.div>

      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
