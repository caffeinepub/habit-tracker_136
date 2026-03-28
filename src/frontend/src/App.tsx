import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import SharePage from "./pages/SharePage";

function getShareToken(): string | null {
  const hash = window.location.hash;
  const pathname = window.location.pathname;

  const hashMatch = hash.match(/\/share\/([^/?#]+)/);
  if (hashMatch) return hashMatch[1];

  const pathMatch = pathname.match(/\/share\/([^/?#]+)/);
  if (pathMatch) return pathMatch[1];

  return null;
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [shareToken] = useState(() => getShareToken());
  const [timedOut, setTimedOut] = useState(false);

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const [currentToken, setCurrentToken] = useState(shareToken);
  useEffect(() => {
    const handlePopState = () => setCurrentToken(getShareToken());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const isStillLoading =
    isInitializing || (isAuthenticated && profileLoading && !profileFetched);

  // Timeout fallback: if still loading after 10 seconds, show error
  useEffect(() => {
    if (!isStillLoading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isStillLoading]);

  if (currentToken) {
    return <SharePage token={currentToken} />;
  }

  // Timed out — show friendly error
  if (timedOut && isStillLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <p className="text-foreground font-medium">
            Taking too long to load. Please check your connection and try again.
          </p>
          <button
            type="button"
            data-ocid="app.retry_button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-accent border-t-foreground animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (profileLoading && !profileFetched) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-accent border-t-foreground animate-spin" />
          <p className="text-muted-foreground text-sm">Setting up...</p>
        </div>
      </div>
    );
  }

  const showProfileSetup =
    isAuthenticated && profileFetched && userProfile === null;

  if (showProfileSetup) {
    return (
      <div className="min-h-screen gradient-bg">
        <ProfileSetupModal open={true} />
      </div>
    );
  }

  return <Dashboard userProfile={userProfile!} />;
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster richColors position="top-right" />
    </>
  );
}
