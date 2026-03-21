import { useState, useEffect } from "react";
import { useAuth } from "../context/authcontext";
import { usersApi, friendsApi } from "../api/client";
import type { User, AppPage } from "../types";
import Avatar from "../components/ui/avatar";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";
import { useToast, ToastContainer } from "../components/ui/toast";
import styles from "./ProfilePage.module.css";

interface ProfilePageProps {
  viewingUserId: string;
  onNavigate: (page: AppPage, userId?: string) => void;
}

export default function ProfilePage({ viewingUserId, onNavigate }: ProfilePageProps) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile]   = useState<User | null>(null);
  const [friends, setFriends]   = useState<User[]>([]);
  const [mutual, setMutual]     = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [requesting, setRequesting] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const isOwnProfile = viewingUserId === currentUser?.id;

  useEffect(() => {
    if (!viewingUserId) return;
    setLoading(true);

    const fetches = [
      usersApi.getProfile(viewingUserId),
      usersApi.getFriends(viewingUserId),
      isOwnProfile
        ? Promise.resolve({ mutual_friends: [] })
        : friendsApi.getMutual(viewingUserId),
    ] as const;

    Promise.all(fetches)
      .then(([profileData, friendsData, mutualData]) => {
        setProfile(profileData.user);
        setFriends(friendsData.friends);
        setMutual(mutualData.mutual_friends);
      })
      .catch(() => showToast("Failed to load profile", "danger"))
      .finally(() => setLoading(false));
  }, [viewingUserId, isOwnProfile]);

  const handleSendRequest = async () => {
    if (!profile) return;
    setRequesting(true);
    try {
      await friendsApi.sendRequest(profile.id);
      showToast("Friend request sent!");
      setProfile((p) => p ? { ...p, is_friend: true } : p);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Request failed", "danger");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <span className="pulse">Loading profile…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.loading}>
        <p>User not found.</p>
        <Button variant="ghost" size="sm" onClick={() => onNavigate("search")}>
          ← Back
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        {/* Back button */}
        <button className={styles.backBtn} onClick={() => onNavigate("search")}>
          ← Back to Search
        </button>

        {/* Profile card */}
        <div className={`${styles.profileCard} fade-up`}>
          <Avatar name={profile.display_name} size="xl" />

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{profile.display_name}</h1>
              {!isOwnProfile && (
                profile.is_friend ? (
                  <Badge label="Friends" variant="success" />
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={requesting}
                    onClick={handleSendRequest}
                  >
                    + Add Friend
                  </Button>
                )
              )}
            </div>

            <div className={styles.username}>@{profile.username}</div>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statVal}>{profile.friend_count ?? friends.length}</span>
                <span className={styles.statLabel}>Friends</span>
              </div>
              {!isOwnProfile && (
                <div className={styles.stat}>
                  <span className={styles.statVal}>{mutual.length}</span>
                  <span className={styles.statLabel}>Mutual</span>
                </div>
              )}
              <div className={styles.stat}>
                <span className={styles.statVal}>
                  {new Date(profile.created_at).toLocaleDateString([], { month: "short", year: "numeric" })}
                </span>
                <span className={styles.statLabel}>Joined</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mutual friends */}
        {!isOwnProfile && mutual.length > 0 && (
          <section className={`${styles.section} fade-up`} style={{ animationDelay: "0.08s" }}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Mutual Friends</h2>
              <Badge label="Graph BFS" variant="dsa" />
            </div>
            <div className={styles.friendGrid}>
              {mutual.map((u) => (
                <FriendChip
                  key={u.id}
                  user={u}
                  onClick={() => onNavigate("profile", u.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Friends list */}
        <section className={`${styles.section} fade-up`} style={{ animationDelay: "0.12s" }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Friends <span className={styles.count}>({friends.length})</span>
            </h2>
          </div>
          {friends.length === 0 ? (
            <p className={styles.noFriends}>No friends yet.</p>
          ) : (
            <div className={styles.friendGrid}>
              {friends.map((u) => (
                <FriendChip
                  key={u.id}
                  user={u}
                  onClick={() => onNavigate("profile", u.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

function FriendChip({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <button className={styles.friendChip} onClick={onClick}>
      <Avatar name={user.display_name} size="sm" />
      <div>
        <div className={styles.chipName}>{user.display_name}</div>
        <div className={styles.chipHandle}>@{user.username}</div>
      </div>
    </button>
  );
}