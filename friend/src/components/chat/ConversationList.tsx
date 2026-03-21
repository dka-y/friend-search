import type { Conversation, User } from "../../types";
import Avatar from "../ui/avatar";
import Badge from "../ui/badge";
import styles from "./ConversationList.module.css";

interface ConversationListProps {
  conversations: Conversation[];
  friends: User[];
  activeUserId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onStartNew: (friend: User) => void;
}

export default function ConversationList({
  conversations,
  friends,
  activeUserId,
  onSelectConversation,
  onStartNew,
}: ConversationListProps) {
  // Friends who don't have a conversation yet
  const convUserIds = new Set(conversations.map((c) => c.other_user_id));
  const newFriends  = friends.filter((f) => !convUserIds.has(f.id));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Messages</h2>
        <div className={styles.dsaLabel}>
          <Badge label="Queue" variant="dsa" />
        </div>
      </div>

      <div className={styles.list}>
        {/* Existing conversations */}
        {conversations.map((conv) => (
          <button
            key={conv.other_user_id}
            className={`${styles.item} ${activeUserId === conv.other_user_id ? styles.active : ""}`}
            onClick={() => onSelectConversation(conv)}
          >
            <Avatar name={conv.other_display_name} size="md" />

            <div className={styles.info}>
              <div className={styles.name}>{conv.other_display_name}</div>
              <div className={styles.lastMsg}>
                {conv.last_sender_is_me && <span className={styles.you}>You: </span>}
                {conv.last_message.length > 30
                  ? conv.last_message.slice(0, 30) + "…"
                  : conv.last_message}
              </div>
            </div>

            <div className={styles.meta}>
              <div className={styles.time}>
                {formatTime(conv.last_timestamp)}
              </div>
              {conv.unread_count > 0 && (
                <span className={styles.unread}>{conv.unread_count}</span>
              )}
            </div>
          </button>
        ))}

        {/* Friends without conversations */}
        {newFriends.length > 0 && (
          <>
            <div className={styles.sectionLabel}>Start a conversation</div>
            {newFriends.map((friend) => (
              <button
                key={friend.id}
                className={`${styles.item} ${styles.newItem}`}
                onClick={() => onStartNew(friend)}
              >
                <Avatar name={friend.display_name} size="md" />
                <div className={styles.info}>
                  <div className={styles.name}>{friend.display_name}</div>
                  <div className={styles.lastMsg}>@{friend.username}</div>
                </div>
              </button>
            ))}
          </>
        )}

        {conversations.length === 0 && newFriends.length === 0 && (
          <div className={styles.empty}>
            Add friends to start chatting
          </div>
        )}
      </div>
    </aside>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1)   return "now";
  if (mins < 60)  return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}