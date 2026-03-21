import type { SearchUser } from "../../types";
import UserCard from "../friends/UserCard";
import styles from "../../styles/Searchresults.module.css";

interface SearchResultsProps {
  results: SearchUser[];
  query: string;
  onViewProfile: (userId: string) => void;
  onSendRequest: (userId: string) => void;
}

export default function SearchResults({
  results,
  query,
  onViewProfile,
  onSendRequest,
}: SearchResultsProps) {
  if (!query) return null;

  if (results.length === 0) {
    return (
      <div className={styles.empty}>
        No users found for <strong>"{query}"</strong>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {results.map((user, i) => (
        <div
          key={user.id}
          className="fade-up"
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          <UserCard
            user={user}
            onViewProfile={() => onViewProfile(user.id)}
            onSendRequest={() => onSendRequest(user.id)}
          />
        </div>
      ))}
    </div>
  );
}