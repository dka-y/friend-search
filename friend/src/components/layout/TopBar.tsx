import { useAuth } from "../../context/authcontext";
import Avatar from "../ui/avatar";
import { useState } from "react";
import styles from "../../styles/Topbar.module.css";
import type { AppPage, SidebarTab } from "../../types";

interface TopBarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onNavigate: (page: AppPage) => void;
  currentPage: AppPage;
  pendingCount: number;
  unreadCount: number;
}
 
const NAV = [
  { key: "search",      label: "Search",      icon: "⌕" },
  { key: "requests",    label: "Requests",    icon: "✦" },
  { key: "suggestions", label: "People",      icon: "◈" },
  { key: "chat",        label: "Messages",    icon: "✉" },
  { key: "profile",     label: "Profile",     icon: "◉" },
] as const;
 
export default function TopBar({
  activeTab,
  onTabChange,
  onNavigate,
  currentPage,
  pendingCount,
  unreadCount,
}: TopBarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;
 
  const getBadge = (key: string) => {
    if (key === "requests") return pendingCount;
    if (key === "chat")     return unreadCount;
    return 0;
  };
 
  const isActive = (key: string) => {
    if (key === "chat")    return currentPage === "chat";
    if (key === "profile") return currentPage === "profile";
    return currentPage === "search" && activeTab === key;
  };
 
  const handleTap = (key: string) => {
    setMenuOpen(false);
    if (key === "chat")    { onNavigate("chat");    return; }
    if (key === "profile") { onNavigate("profile"); return; }
    if (currentPage !== "search") onNavigate("search");
    onTabChange(key as SidebarTab);
  };
 
  return (
    <>
      {/* ── Slim header — logo + avatar only ── */}
      <header className={styles.topbar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>FriendSearch</span>
        </div>
 
        <button
          className={styles.avatarBtn}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <Avatar name={user.display_name} size="sm" />
        </button>
      </header>
 
      {/* Avatar dropdown */}
      {menuOpen && (
        <div className={styles.menu}>
          <button onClick={() => { onNavigate("profile"); setMenuOpen(false); }}>
            My Profile
          </button>
          <button
            className={styles.menuLogout}
            onClick={() => { logout(); setMenuOpen(false); }}
          >
            Sign out
          </button>
        </div>
      )}
 
      {/* ── Bottom nav bar ── */}
      <nav className={styles.bottomNav}>
        {NAV.map((item) => {
          const badge = getBadge(item.key);
          const active = isActive(item.key);
          return (
            <button
              key={item.key}
              className={`${styles.navBtn} ${active ? styles.navBtnActive : ""}`}
              onClick={() => handleTap(item.key)}
            >
              <span className={styles.navIconWrap}>
                <span className={styles.navIcon}>{item.icon}</span>
                {badge > 0 && (
                  <span className={styles.navBadge}>
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}