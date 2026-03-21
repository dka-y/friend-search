import type { SuggestedUser } from "../../types";
import Avatar from "../ui/avatar";
import Badge from "../ui/badge";
import Button from "../ui/button";
import styles from "./SuggestionsPanel.module.css";

interface SuggestionsPanelProps {
  suggestions: SuggestedUser[];
  onSendRequest: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

export default function SuggestionsPanel({
  suggestions,
  onSendRequest,
  onViewProfile,
}: SuggestionsPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>People You May Know</h2>
        <div className={styles.dsaLabel}>
          <Badge label="Graph BFS" variant="dsa" />
          <span className={styles.dsaNote}>friends-of-friends · ranked by</span>
          <Badge label="Heap" variant="dsa" />
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className={styles.empty}>
          No suggestions yet. Add more friends first!
        </div>
      ) : (
        <div className={styles.list}>
          {suggestions.map((user, i) => (
            <div
              key={user.id}
              className={`${styles.card} fade-up`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <Avatar
                name={user.display_name}
                size="md"
                onClick={() => onViewProfile(user.id)}
              />

              <div className={styles.info} onClick={() => onViewProfile(user.id)}>
                <div className={styles.name}>{user.display_name}</div>
                <div className={styles.username}>@{user.username}</div>
                {user.bio && (
                  <div className={styles.bio}>{user.bio}</div>
                )}
              </div>

              <div className={styles.right}>
                <span className={styles.mutualCount}>
                  {user.mutual_friends} mutual
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSendRequest(user.id)}
                >
                  + Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}