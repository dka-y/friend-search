import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/authcontext";
import { searchApi, friendsApi } from "../api/client";
import type { SearchUser, SuggestedUser, FriendRequest, SidebarTab, AppPage } from "../types";
import { useDebounce } from "../hooks/useDebounce";

import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";
import SearchBar from "../components/search/SearchBar";
import SearchResults from "../components/search/SearchResults";
import HistoryPanel from "../components/search/HistoryPanel";
import RequestsPanel from "../components/friends/RequestPanel";
import SuggestionsPanel from "../components/friends/SuggestionsPanel";
import Badge from "../components/ui/badge";
import { ToastContainer, useToast } from "../components/ui/toast";

import styles from "../styles/Searchpage.module.css";

interface SearchPageProps {
  onNavigate: (page: AppPage, userId?: string) => void;
}

export default function SearchPage({ onNavigate }: SearchPageProps) {
  const { user } = useAuth();

  // ── Search state ────────────────────────────────────────────────────────────
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [history, setHistory]   = useState<string[]>([]);
  const debouncedQuery          = useDebounce(query, 280);

  // ── Sidebar data ─────────────────────────────────────────────────────────────
  const [pending, setPending]         = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [activeTab, setActiveTab]     = useState<SidebarTab>("search");

  const { toasts, showToast, removeToast } = useToast();

  // ── Load sidebar data ────────────────────────────────────────────────────────
  const loadSidebar = useCallback(async () => {
    try {
      const [pendData, suggData] = await Promise.all([
        friendsApi.getPending(),
        friendsApi.getSuggestions(),
      ]);
      setPending(pendData.pending);
      setSuggestions(suggData.suggestions);
    } catch {
      // silently ignore sidebar load errors
    }
  }, []);

  useEffect(() => { loadSidebar(); }, [loadSidebar]);

  // ── Debounced search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }

    setSearching(true);
    searchApi
      .autocomplete(debouncedQuery)
      .then((data) => {
        setResults(data.results);
        // Refresh history after every search
        return searchApi.getHistory();
      })
      .then((h) => setHistory(h.history))
      .catch(() => showToast("Search failed", "danger"))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  // Load history on mount
  useEffect(() => {
    searchApi.getHistory().then((h) => setHistory(h.history)).catch(() => {});
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleSendRequest = async (toUserId: string) => {
    try {
      await friendsApi.sendRequest(toUserId);
      showToast("Friend request sent!");
      setResults((prev) =>
        prev.map((u) => u.id === toUserId ? { ...u, request_pending: true } : u)
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Request failed", "danger");
    }
  };

  const handleAccept = async (fromUser: string) => {
    try {
      await friendsApi.acceptRequest(fromUser);
      showToast("Friend request accepted!");
      loadSidebar();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Accept failed", "danger");
    }
  };

  const handleReject = async (fromUser: string) => {
    try {
      await friendsApi.rejectRequest(fromUser);
      showToast("Request declined.", "info");
      loadSidebar();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Reject failed", "danger");
    }
  };

  const handleUndo = async () => {
    try {
      await searchApi.undoSearch();
      const h = await searchApi.getHistory();
      setHistory(h.history);
      showToast("Last search removed", "info");
    } catch {
      showToast("Undo failed", "danger");
    }
  };

  const handleHistoryClick = (q: string) => {
    setQuery(q);
  };

  if (!user) return null;

  return (
    <div className={styles.root}>
      {/* Desktop sidebar */}
      <div className={styles.sidebarWrap}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNavigate={onNavigate}
          currentPage="search"
          pendingCount={pending.length}
          unreadCount={0}
        />
      </div>

      {/* Mobile topbar */}
      <div className={styles.topbarWrap}>
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNavigate={onNavigate}
          currentPage="search"
          pendingCount={pending.length}
          unreadCount={0}
        />
      </div>

      {/* Main content */}
      <main className={styles.main}>
        {activeTab === "search" && (
          <>
            <div className={`${styles.header} fade-up`}>
              <h1>Find Friends</h1>
              <p>Search by name or username. Results ranked by mutual connections.</p>
            </div>

            <div className={`${styles.searchWrap} fade-up`} style={{ animationDelay: "0.05s" }}>
              <SearchBar
                value={query}
                onChange={setQuery}
                loading={searching}
              />
            </div>

            {/* DSA labels */}
            <div className={`${styles.dsaRow} fade-up`} style={{ animationDelay: "0.1s" }}>
              <Badge label="Trie" variant="dsa" />
              <span className={styles.dsaSep}>autocomplete ·</span>
              <Badge label="Heap" variant="dsa" />
              <span className={styles.dsaSep}>ranking ·</span>
              <Badge label="Graph BFS" variant="dsa" />
              <span className={styles.dsaSep}>mutual friends ·</span>
              <Badge label="Stack" variant="dsa" />
              <span className={styles.dsaSep}>history</span>
            </div>

            <div style={{ animationDelay: "0.12s" }} className="fade-up">
              <SearchResults
                results={results}
                query={query}
                onViewProfile={(id) => onNavigate("profile", id)}
                onSendRequest={handleSendRequest}
              />
            </div>

            <div style={{ animationDelay: "0.16s", marginTop: "20px" }} className="fade-up">
              <HistoryPanel
                history={history}
                onClickItem={handleHistoryClick}
                onUndo={handleUndo}
              />
            </div>
          </>
        )}

        {activeTab === "requests" && (
          <RequestsPanel
            pending={pending}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        )}

        {activeTab === "suggestions" && (
          <SuggestionsPanel
            suggestions={suggestions}
            onSendRequest={handleSendRequest}
            onViewProfile={(id) => onNavigate("profile", id)}
          />
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}