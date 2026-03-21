import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/authcontext";
import { chatApi, usersApi } from "../api/client";
import type { Conversation, Message, User, AppPage } from "../types";
import { usePolling } from "../hooks/usePooling";
import ConversationList from "../components/chat/ConversationList";
import MessageThread from "../components/chat/MessageThread";
import MessageInput from "../components/chat/MessageInput";
import Button from "../components/ui/button";
import Avatar from "../components/ui/avatar";
import { ToastContainer, useToast } from "../components/ui/toast";
import styles from "./ChatPage.module.css";

interface ChatPageProps {
  onNavigate: (page: AppPage, userId?: string) => void;
}

interface ActiveConv {
  other_user_id: string;
  other_display_name: string;
  other_username: string;
}

export default function ChatPage({ onNavigate }: ChatPageProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends]             = useState<User[]>([]);
  const [active, setActive]               = useState<ActiveConv | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState("1970-01-01T00:00:00");
  const [draft, setDraft]                 = useState("");
  const [sending, setSending]             = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  if (!user) return null;

  // ── Load conversations + friends 
  const loadConversations = useCallback(async () => {
    try {
      const [convData, friendData] = await Promise.all([
        chatApi.getConversations(),
        usersApi.getFriends(user.id),
      ]);
      setConversations(convData.conversations);
      setFriends(friendData.friends);
    } catch {
      showToast("Failed to load conversations", "danger");
    }
  }, [user.id]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Open conversation 
  const openConversation = useCallback(async (conv: ActiveConv) => {
    setActive(conv);
    setMessages([]);
    try {
      const data = await chatApi.getConversation(conv.other_user_id);
      setMessages(data.messages);
      const latest = data.messages.at(-1)?.timestamp ?? "1970-01-01T00:00:00";
      setLastTimestamp(latest);
      loadConversations();
    } catch {
      showToast("Failed to load messages", "danger");
    }
  }, [loadConversations]);

  const handleSelectConversation = (conv: Conversation) => {
    openConversation({
      other_user_id:      conv.other_user_id,
      other_display_name: conv.other_display_name,
      other_username:     conv.other_username,
    });
  };

  const handleStartNew = (friend: User) => {
    openConversation({
      other_user_id:      friend.id,
      other_display_name: friend.display_name,
      other_username:     friend.username,
    });
  };

  //  Polling for new messages 
  const pollCallback = useCallback(async () => {
    if (!active) return;
    try {
      const data = await chatApi.pollMessages(active.other_user_id, lastTimestamp);
      if (data.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = data.messages.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newMsgs];
        });
        setLastTimestamp(data.messages.at(-1)!.timestamp);
        loadConversations();
      }
    } catch {
      // silently ignore poll errors
    }
  }, [active, lastTimestamp, loadConversations]);

  usePolling(pollCallback, 2500, !!active);

  // Send message
  const handleSend = async () => {
    if (!active || !draft.trim() || sending) return;
    const content = draft.trim();
    setDraft("");
    setSending(true);
    try {
      const data = await chatApi.sendMessage(active.other_user_id, content);
      setMessages((prev) => [...prev, data.message]);
      setLastTimestamp(data.message.timestamp);
      loadConversations();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Send failed", "danger");
      setDraft(content); // restore draft on failure
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* Back button — mobile / top of page */}
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => onNavigate("search")}>
          ← Back
        </button>
      </div>

      <div className={styles.body}>
        {/* Conversation list sidebar */}
        <ConversationList
          conversations={conversations}
          friends={friends}
          activeUserId={active?.other_user_id ?? null}
          onSelectConversation={handleSelectConversation}
          onStartNew={handleStartNew}
        />

        {/* Message area */}
        <div className={styles.chatArea}>
          {!active ? (
            <div className={styles.placeholder}>
              <span className={styles.placeholderIcon}>💬</span>
              <h3>Select a conversation</h3>
              <p>Choose a friend from the left to start chatting</p>
            </div>
          ) : (
            <>
              {/* Top bar */}
              <div className={styles.chatTopBar}>
                <Avatar name={active.other_display_name} size="md" />
                <div>
                  <div className={styles.chatName}>{active.other_display_name}</div>
                  <div className={styles.chatHandle}>@{active.other_username}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("profile", active.other_user_id)}
                >
                  View Profile →
                </Button>
              </div>

              {/* Messages */}
              <MessageThread
                messages={messages}
                currentUserId={user.id}
                otherName={active.other_display_name}
                otherUsername={active.other_username}
                onViewProfile={() => onNavigate("profile", active.other_user_id)}
              />

              {/* Input */}
              <MessageInput
                value={draft}
                onChange={setDraft}
                onSend={handleSend}
                sending={sending}
                placeholder={`Message ${active.other_display_name}…`}
              />
            </>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}