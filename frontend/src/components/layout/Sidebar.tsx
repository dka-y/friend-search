import { useAuth } from "../../context/authcontext";
import Avatar from "../ui/avatar";
import styles from "../../styles/Sidebar.module.css";
import type { AppPage, SidebarTab } from "../../types";

interface NavItem {
  key: SidebarTab | "chat";
  label: string;
  icon: string;
  count?: number;
}

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onNavigate: (page: AppPage) => void;
  currentPage: AppPage;
  pendingCount: number;
  unreadCount: number;
}

const NAV_ITEMS: NavItem[] = [
  { key: "search",      label: "Search",      icon: "⌕"  },
  { key: "requests",    label: "Requests",    icon: "✦"  },
  { key: "suggestions", label: "Suggestions", icon: "◈"  },
  { key: "chat",        label: "Messages",    icon: "✉"  },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  onNavigate,
  currentPage,
  pendingCount,
  unreadCount,
}: SidebarProps) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const getBadgeCount = (key: string) => {
    if (key === "requests") return pendingCount;
    if (key === "chat")     return unreadCount;
    return 0;
  };

  const handleNavClick = (key: SidebarTab | "chat") => {
    if (key === "chat") {
      onNavigate("chat");
    } else {
      if (currentPage !== "search") onNavigate("search");
      onTabChange(key as SidebarTab);
    }
  };

  const isActive = (key: SidebarTab | "chat") => {
    if (key === "chat")    return currentPage === "chat";
    if (currentPage !== "search") return false;
    return activeTab === key;
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⬡</span>
        <span className={styles.logoText}>FriendSearch</span>
      </div>

      {/* Current user pill */}
      <button
        className={styles.userPill}
        onClick={() => onNavigate("profile")}
      >
        <Avatar name={user.display_name} size="sm" />
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.display_name}</span>
          <span className={styles.userHandle}>@{user.username}</span>
        </div>
      </button>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const count = getBadgeCount(item.key);
          return (
            <button
              key={item.key}
              className={`${styles.navItem} ${isActive(item.key) ? styles.active : ""}`}
              onClick={() => handleNavClick(item.key)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {count > 0 && (
                <span className={styles.navBadge}>{count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <button className={styles.logoutBtn} onClick={logout}>
        ← Sign out
      </button>
    </aside>
  );
}