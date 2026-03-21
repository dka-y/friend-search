import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.environ.get("DB_PATH","friendsearch.db")

def get_connection () -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

# schema
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    username     TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email        TEXT UNIQUE NOT NULL,
    bio          TEXT DEFAULT '',
    avatar_url   TEXT DEFAULT '',
    password_hash TEXT DEFAULT NULL,
    created_at   TEXT NOT NULL
);
 
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
 
CREATE TABLE IF NOT EXISTS friendships (
    user_a TEXT NOT NULL,
    user_b TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_a, user_b),
    FOREIGN KEY (user_a) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_b) REFERENCES users(id) ON DELETE CASCADE
);
 
CREATE INDEX IF NOT EXISTS idx_friendships_a ON friendships(user_a);
CREATE INDEX IF NOT EXISTS idx_friendships_b ON friendships(user_b);
 
CREATE TABLE IF NOT EXISTS friend_requests (
    from_user  TEXT NOT NULL,
    to_user    TEXT NOT NULL,
    status     TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    PRIMARY KEY (from_user, to_user),
    FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user)   REFERENCES users(id) ON DELETE CASCADE
);
 
CREATE INDEX IF NOT EXISTS idx_requests_to ON friend_requests(to_user);


"""

def init_db() -> None:
    with get_db() as conn:
        conn.executescript(SCHEMA)
    print(f"[db] Initialised at {DB_PATH}")

def db_insert_user (user_id, username, display_name, email, bio, created_at, password_hash=None) -> None:
    with get_db() as conn:
        con.execute(
            "INSERT INTO users (id, username, display_name, email, bio, created_at, password_hash) VALUES (?,?,?,?,?,?,?)",
            (user_id, username.lower(), display_name, email, bio, created_at, password_hash)
        )


def db_get_user_by_id(user_id: str) -> sqlite3.Row | None:
    with get_db() as conn:
        return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,) ). fetchone()

def db_get_user_by_username(username: str) -> sqlite3.Row | None:
    with get_db() ass conn:
        return conn.execute("SELECT * FROM users WHERE username = ?", (username.lower(),)).fetchone()


def db_get_all_users() -> list[sqlite3.Row]:
    with get_db() as conn:
        return conn.execute("SELECT * FROM users ORDER BY created_at").fetchall()
 
 
def db_get_users_by_ids(user_ids: list[str]) -> list[sqlite3.Row]:
    if not user_ids:
        return []
    placeholders = ",".join("?" * len(user_ids))
    with get_db() as conn:
        return conn.execute(
            f"SELECT * FROM users WHERE id IN ({placeholders})", user_ids
        ).fetchall()
 
 
def db_update_bio(user_id: str, bio: str) -> None:
    with get_db() as conn:
        conn.execute("UPDATE users SET bio = ? WHERE id = ?", (bio, user_id))
 
 
def db_delete_user(user_id: str) -> None:
    with get_db() as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
 
 
def db_username_exists(username: str) -> bool:
    with get_db() as conn:
        row = conn.execute("SELECT 1 FROM users WHERE username = ?", (username.lower(),)).fetchone()
        return row is not 
        
# friendship queries 


def _ordered(a: str, b: str) -> tuple[str, str]:
    # Always store (smaller_id, larger_id) to avoid duplicate edges.
    return (a, b) if a < b else (b, a)
 
 
def db_add_friendship(user_a: str, user_b: str, created_at: str) -> None:
    a, b = _ordered(user_a, user_b)
    with get_db() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO friendships (user_a, user_b, created_at) VALUES (?,?,?)",
            (a, b, created_at)
        )
 
 
def db_remove_friendship(user_a: str, user_b: str) -> None:
    a, b = _ordered(user_a, user_b)
    with get_db() as conn:
        conn.execute("DELETE FROM friendships WHERE user_a=? AND user_b=?", (a, b))
 
 
def db_get_all_friendships() -> list[sqlite3.Row]:
    with get_db() as conn:
        return conn.execute("SELECT user_a, user_b FROM friendships").fetchall()
 
 
def db_get_friends_of(user_id: str) -> list[str]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT CASE WHEN user_a=? THEN user_b ELSE user_a END AS friend_id "
            "FROM friendships WHERE user_a=? OR user_b=?",
            (user_id, user_id, user_id)
        ).fetchall()
    return [r["friend_id"] for r in rows]
 
 
def db_friendship_exists(user_a: str, user_b: str) -> bool:
    a, b = _ordered(user_a, user_b)
    with get_db() as conn:
        row = conn.execute(
            "SELECT 1 FROM friendships WHERE user_a=? AND user_b=?", (a, b)
        ).fetchone()
    return row is not None
 

 # friend request

# Returns True if inserted, False if already exists.
def db_insert_request(from_user: str, to_user: str, created_at: str) -> bool:
    
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO friend_requests (from_user, to_user, created_at) VALUES (?,?,?)",
                (from_user, to_user, created_at)
            )
        return True
    except sqlite3.IntegrityError:
        return False
 
 
def db_delete_request(from_user: str, to_user: str) -> bool:
    with get_db() as conn:
        cur = conn.execute(
            "DELETE FROM friend_requests WHERE from_user=? AND to_user=?",
            (from_user, to_user)
        )
    return cur.rowcount > 0
 
 
def db_get_pending_requests_for(to_user: str) -> list[sqlite3.Row]:
    with get_db() as conn:
        return conn.execute(
            "SELECT * FROM friend_requests WHERE to_user=? AND status='pending' ORDER BY created_at",
            (to_user,)
        ).fetchall()
 
 
def db_get_sent_requests_by(from_user: str) -> list[sqlite3.Row]:
    with get_db() as conn:
        return conn.execute(
            "SELECT * FROM friend_requests WHERE from_user=? AND status='pending'",
            (from_user,)
        ).fetchall()
 
 
def db_request_exists(from_user: str, to_user: str) -> bool:
    with get_db() as conn:
        row = conn.execute(
            "SELECT 1 FROM friend_requests WHERE from_user=? AND to_user=? AND status='pending'",
            (from_user, to_user)
        ).fetchone()
    return row is not None

# chat queries

 
CHAT_SCHEMA = """
CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,
    sender_id   TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content     TEXT NOT NULL,
    timestamp   TEXT NOT NULL,
    read        INTEGER DEFAULT 0,
    FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
 
CREATE INDEX IF NOT EXISTS idx_messages_sender   ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv     ON messages(sender_id, receiver_id, timestamp);
"""
 
 
def init_chat_db() -> None:
    # Create chat tables — called from bootstrap.
    with get_db() as conn:
        conn.executescript(CHAT_SCHEMA)
    print("[db] Chat tables ready.")
 
 
def db_insert_message(msg_id: str, sender_id: str, receiver_id: str,
                      content: str, timestamp: str) -> None:
    with get_db() as conn:
        conn.execute(
            "INSERT INTO messages (id, sender_id, receiver_id, content, timestamp) VALUES (?,?,?,?,?)",
            (msg_id, sender_id, receiver_id, content, timestamp)
        )
 
 
def db_get_conversation(user_a: str, user_b: str, limit: int = 50) -> list:
    
    # Fetch the last limit messages between two users, oldest first.
    # Uses the (sender_id, receiver_id, timestamp) index.
    
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM messages
            WHERE (sender_id=? AND receiver_id=?)
               OR (sender_id=? AND receiver_id=?)
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (user_a, user_b, user_b, user_a, limit)
        ).fetchall()
    return list(reversed(rows))  # return oldest-first
 
 
def db_get_conversations_for_user(user_id: str) -> list:
    
    # Get the latest message from each unique conversation the user is in.
    # Used to build the conversation list sidebar.
    
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT
                CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user,
                content, timestamp, read, sender_id
            FROM messages
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY other_user
            HAVING timestamp = MAX(timestamp)
            ORDER BY timestamp DESC
            """,
            (user_id, user_id, user_id)
        ).fetchall()
    return rows
 
 
def db_mark_messages_read(reader_id: str, sender_id: str) -> None:
    # Mark all messages from sender_id to reader_id as read.
    with get_db() as conn:
        conn.execute(
            "UPDATE messages SET read=1 WHERE sender_id=? AND receiver_id=? AND read=0",
            (sender_id, reader_id)
        )
 
 
def db_unread_count(receiver_id: str, sender_id: str) -> int:
    # Count unread messages from one specific sender.
    with get_db() as conn:
        row = conn.execute(
            "SELECT COUNT(*) FROM messages WHERE sender_id=? AND receiver_id=? AND read=0",
            (sender_id, receiver_id)
        ).fetchone()
    return row[0] if row else 0
 
 
def db_total_unread(user_id: str) -> int:
    # Total unread messages across all conversations.
    with get_db() as conn:
        row = conn.execute(
            "SELECT COUNT(*) FROM messages WHERE receiver_id=? AND read=0",
            (user_id,)
        ).fetchone()
    return row[0] if row else 0
 
 
def db_get_messages_since(user_a: str, user_b: str, since_timestamp: str) -> list:
    # Fetch only messages newer than a timestamp — used for polling.
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM messages
            WHERE ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?))
              AND timestamp > ?
            ORDER BY timestamp ASC
            """,
            (user_a, user_b, user_b, user_a, since_timestamp)
        ).fetchall()
    return rows

# auth

def db_get_password_hash(user_id: str) -> str | None:
  
    with get_db() as conn:
        row = conn.execute(
            "SELECT password_hash FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    return row["password_hash"] if row else None
 
 
def db_set_password_hash(user_id: str, password_hash: str) -> None:
  
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (password_hash, user_id)
        )