import { useState } from "react";
import { useAuth } from "./context/authcontext";
import type { AppPage } from "./types";

import LoginPage   from "./pages/LoginPage";
import SearchPage  from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage    from "./pages/Chatpage";

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage]             = useState<AppPage>("login");
  const [viewingUserId, setViewingUserId] = useState<string>("");
  // state routing
  const navigateTo = (p: AppPage, userId?: string) => {
    if (userId) setViewingUserId(userId);
    setPage(p);
  };

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", color: "var(--text-muted)", fontSize: "14px",
      }}>
        Loading…
      </div>
    );
  }

  // Not logged in — always show login
  if (!user) return <LoginPage />;

  // Logged in routing
  if (page === "profile") {
    return (
      <ProfilePage
        viewingUserId={viewingUserId || user.id}
        onNavigate={navigateTo}
      />
    );
  }

  if (page === "chat") {
    return <ChatPage onNavigate={navigateTo} />;
  }

  // Default: search page
  return <SearchPage onNavigate={navigateTo} />;
}