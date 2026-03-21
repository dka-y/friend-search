from datetime import datetime
from app.db import (
    init_db,
    db_insert_user, db_get_user_by_id, db_get_user_by_username,
    db_get_all_users, db_get_users_by_ids, db_update_bio, db_delete_user,
    db_username_exists,
    db_add_friendship, db_remove_friendship, db_get_all_friendships,
    db_get_friends_of, db_friendship_exists,
    db_insert_request, db_delete_request,
    db_get_pending_requests_for, db_get_sent_requests_by, db_request_exists,
)
from app.data_structures.trie import Trie
from app.data_structures.graph import FriendGraph
from app.data_structures.hashmap import User
from app.data_structures.stack import SearchHistoryStack
from app.data_structures.queue import FriendRequestQueue, FriendRequest, MessageQueue

def _row_to_user(row) -> User:
    return User(
        id=row["id"],
        username=row["username"],
        display_name=row["display_name"],
        email=row["email"],
        bio=row["bio"] or "",
        avatar_url=row["avatar_url"] or "",
        created_at=row["created_at"],
    )

class AppStore:
    def __init__(self):
        self.trie = Trie()
        self.graph = FriendGraph()
        self.request_queue = FriendRequestQueue()
        self.message_queue = MessageQueue()
        self._search_histories: dict[str, SearchHistoryStack] = {}

        def bootstrap(self) -> None:
        # Call once at startup — init DB, rebuild in-memory structures.
        init_db()
        self._load_users_into_trie()
        self._load_friendships_into_graph()
        self._load_requests_into_queue()
        print("[store] In-memory structures rebuilt from DB.")
 
    def _load_users_into_trie(self) -> None:
        rows = db_get_all_users()
        for row in rows:
            self.trie.insert(row["username"], row["id"])
            self.trie.insert(row["display_name"], row["id"])
            self.graph.add_user(row["id"])
        print(f"[store] Loaded {len(rows)} users into Trie + Graph.")
 
    def _load_friendships_into_graph(self) -> None:
        rows = db_get_all_friendships()
        for row in rows:
            self.graph.add_friendship(row["user_a"], row["user_b"])
        print(f"[store] Loaded {len(rows)} friendships into Graph.")
 
    def _load_requests_into_queue(self) -> None:
        from app.db import get_db
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM friend_requests WHERE status='pending' ORDER BY created_at"
            ).fetchall()
        for row in rows:
            req = FriendRequest(
                from_user=row["from_user"],
                to_user=row["to_user"],
                timestamp=row["created_at"],
            )
            self.request_queue._queue.append(req)
            self.request_queue._index[(req.from_user, req.to_user)] = req
        print(f"[store] Loaded {len(rows)} pending requests into Queue.")


        # search history
        
    def get_history_stack(self, user_id: str) -> SearchHistoryStack:
        if user_id not in self._search_histories:
            self._search_histories[user_id] = SearchHistoryStack()
        return self._search_histories[user_id]
 
    def record_search(self, user_id: str, query: str) -> None:
        self.get_history_stack(user_id).push(query)
 
    def undo_search(self, user_id: str) -> str | None:
        return self.get_history_stack(user_id).pop()
 
    def get_search_history(self, user_id: str) -> list[str]:
        return self.get_history_stack(user_id).get_all()


    # user registration
     def register_user(self, username: str, display_name: str, email: str, bio: str = "", password_hash: str = None) -> User:
        if db_username_exists(username):
            raise ValueError(f"Username '{username}' already taken.")
 
        import uuid
        user = User(
            id=str(uuid.uuid4()),
            username=username.lower(),
            display_name=display_name,
            email=email,
            bio=bio,
        )
        db_insert_user(user.id, user.username, user.display_name, user.email, user.bio, user.created_at, password_hash)
        self.trie.insert(user.username, user.id)
        self.trie.insert(user.display_name, user.id)
        self.graph.add_user(user.id)
        return user
 
    def get_user_by_id(self, user_id: str) -> User | None:
        row = db_get_user_by_id(user_id)
        return _row_to_user(row) if row else None
 
    def get_user_by_username(self, username: str) -> User | None:
        row = db_get_user_by_username(username)
        return _row_to_user(row) if row else None
 
    def get_users_by_ids(self, user_ids: list[str]) -> list[User]:
        rows = db_get_users_by_ids(user_ids)
        return [_row_to_user(r) for r in rows]
 
    def all_users(self) -> list[User]:
        return [_row_to_user(r) for r in db_get_all_users()]
 
    def update_bio(self, user_id: str, bio: str) -> None:
        db_update_bio(user_id, bio)

    #friend

    def make_friends(self, user_a: str, user_b: str) -> None:
        ts = datetime.utcnow().isoformat()
        db_add_friendship(user_a, user_b, ts)
        self.graph.add_friendship(user_a, user_b)
 
    def unfriend(self, user_a: str, user_b: str) -> None:
        db_remove_friendship(user_a, user_b)
        self.graph.remove_friendship(user_a, user_b)
 
    def are_friends(self, user_a: str, user_b: str) -> bool:
        return self.graph.are_friends(user_a, user_b)
 
    def get_friends(self, user_id: str) -> list[str]:
        return self.graph.get_friends(user_id)


     def send_request(self, from_user: str, to_user: str) -> FriendRequest | None:
        ts = datetime.utcnow().isoformat()
        inserted = db_insert_request(from_user, to_user, ts)
        if not inserted:
            return None
        req = FriendRequest(from_user=from_user, to_user=to_user, timestamp=ts)
        self.request_queue._queue.append(req)
        self.request_queue._index[(from_user, to_user)] = req
        return req
 
    def accept_request(self, from_user: str, to_user: str) -> bool:
        self.request_queue.remove_request(from_user, to_user)
        db_delete_request(from_user, to_user)
        self.make_friends(from_user, to_user)
        return True
 
    def reject_request(self, from_user: str, to_user: str) -> bool:
        self.request_queue.remove_request(from_user, to_user)
        return db_delete_request(from_user, to_user)
 
    def get_pending_for_user(self, user_id: str):
        return db_get_pending_requests_for(user_id)
 
    def get_sent_by_user(self, user_id: str):
        return db_get_sent_requests_by(user_id)
 
    def request_pending(self, from_user: str, to_user: str) -> bool:
        return db_request_exists(from_user, to_user)


store = AppStore()