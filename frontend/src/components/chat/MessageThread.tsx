import { useEffect, useRef } from "react";
import type { Message } from "../../types";
import Avatar from "../ui/avatar";
import styles from "../../styles/Messagethread.module.css";

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  otherName: string;
  otherUsername: string;
  onViewProfile: () => void;
}

export default function MessageThread({
  messages,
  currentUserId,
  otherName,
  otherUsername,
  onViewProfile,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>💬</span>
        <p>No messages yet. Say hello!</p>
      </div>
    );
  }

  return (
    <div className={styles.thread}>
      {messages.map((msg, i) => {
        const isMe = msg.sender_id === currentUserId;
        const isFirst = i === 0 || messages[i - 1].sender_id !== msg.sender_id;
        const isLast = i === messages.length - 1 || messages[i + 1].sender_id !== msg.sender_id;

        return (
          <div
            key={msg.id}
            className={`${styles.row} ${isMe ? styles.me : styles.them}`}
          >
            {/* Avatar — only shown on first message in a group, other side only */}
            {!isMe && (
              isFirst
                ? <Avatar name={otherName} size="sm" onClick={onViewProfile} />
                : <div className={styles.avatarSpacer} />
            )}

            <div className={styles.bubbleWrap}>
              <div
                className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}
              >
                {msg.content}
              </div>

              {/* Timestamp + read receipt — only on last in group */}
              {isLast && (
                <div className={`${styles.meta} ${isMe ? styles.metaMe : ""}`}>
                  {formatTime(msg.timestamp)}
                  {isMe && (
                    <span className={styles.receipt}>
                      {msg.read ? " ✓✓" : " ✓"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}