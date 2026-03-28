import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import SharePage from "./pages/SharePage";

function getShareToken(): string | null {
  // Support both hash routing (#/share/TOKEN) and regular (/share/TOKEN)
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

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  // Listen for navigation to share pages
  const [currentToken, setCurrentToken] = useState(shareToken);
  useEffect(() => {
    const handlePopState = () => setCurrentToken(getShareToken());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Share page - no auth needed
  if (currentToken) {
    return <SharePage token={currentToken} />;
  }

  // Loading
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

  // Not logged in
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Logged in but profile loading
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

  // Show profile setup if no profile
  const showProfileSetup =
    isAuthenticated && profileFetched && userProfile === null;

  // If no profile yet, show modal over blank bg
  if (showProfileSetup) {
    return (
      <div className="min-h-screen gradient-bg">
        <ProfileSetupModal open={true} />
      </div>
    );
  }

  // Main app
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
