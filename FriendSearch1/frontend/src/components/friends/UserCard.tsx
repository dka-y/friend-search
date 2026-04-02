import type { SearchUser } from "../../types";
import Avatar from "../ui/avatar";
import Badge from "../ui/badge";
import Button from "../ui/button";
import styles from "../../styles/Usecard.module.css";

interface UserCardProps {
  user: SearchUser;
  onViewProfile: () => void;
  onSendRequest: () => void;
}

export default function UserCard({
  user,
  onViewProfile,
  onSendRequest,
}: UserCardProps) {
  return (
    <div className={styles.card}>
      <Avatar
        name={user.display_name}
        size="md"
        onClick={onViewProfile}
      />

      <div className={styles.info} onClick={onViewProfile}>
        <div className={styles.name}>{user.display_name}</div>
        <div className={styles.username}>@{user.username}</div>
        {user.mutual_friends > 0 && (
          <div className={styles.mutual}>
            <span className={styles.mutualDot} />
            {user.mutual_friends} mutual friend{user.mutual_friends !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {user.is_friend ? (
          <Badge label="Friends" variant="success" />
        ) : user.request_pending ? (
          <Badge label="Pending" variant="muted" />
        ) : (
          <Button variant="primary" size="sm" onClick={onSendRequest}>
            + Add
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onViewProfile}>
          View
        </Button>
      </div>
    </div>
  );
}