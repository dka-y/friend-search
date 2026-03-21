import type { FriendRequest } from "../../types";
import Avatar from "../ui/avatar";
import Badge from "../ui/badge";
import Button from "../ui/button";
import styles from "./RequestsPanel.module.css";

interface RequestsPanelProps {
  pending: FriendRequest[];
  onAccept: (fromUser: string) => void;
  onReject: (fromUser: string) => void;
}

export default function RequestsPanel({
  pending,
  onAccept,
  onReject,
}: RequestsPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Friend Requests</h2>
        <div className={styles.dsaLabel}>
          <Badge label="Queue" variant="dsa" />
          <span className={styles.dsaNote}>FIFO processing</span>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className={styles.empty}>
          No pending friend requests.
        </div>
      ) : (
        <div className={styles.list}>
          {pending.map((req, i) => (
            <div
              key={req.from_user}
              className={`${styles.card} fade-up`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <Avatar name={req.sender_name} size="md" />

              <div className={styles.info}>
                <div className={styles.name}>{req.sender_name}</div>
                <div className={styles.username}>@{req.sender_username}</div>
                <div className={styles.time}>
                  {new Date(req.timestamp).toLocaleDateString()}
                </div>
              </div>

              <div className={styles.actions}>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => onAccept(req.from_user)}
                >
                  Accept
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onReject(req.from_user)}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}