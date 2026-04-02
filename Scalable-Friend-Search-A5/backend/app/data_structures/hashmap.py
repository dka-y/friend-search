from dataclasses import dataclass, field
from datetime import datetime
import uuid
 
 
@dataclass
class User:
    id: str
    username: str
    display_name: str
    email: str
    bio: str = ""
    avatar_url: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
 
    def to_dict(self, include_email: bool = False) -> dict:
        d = {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name,
            "bio": self.bio,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at,
        }
        if include_email:
            d["email"] = self.email
        return d
 
 
class UserStore:
   
 
    def __init__(self):
        self._by_id: dict[str, User] = {}       # hash map: id -> User
        self._by_username: dict[str, str] = {}  # hash map: username -> id
 
    def add_user(self, username: str, display_name: str, email: str, bio: str = "") -> User:
        if username.lower() in self._by_username:
            raise ValueError(f"Username '{username}' already taken.")
        user = User(
            id=str(uuid.uuid4()),
            username=username.lower(),
            display_name=display_name,
            email=email,
            bio=bio,
        )
        self._by_id[user.id] = user
        self._by_username[user.username] = user.id
        return user
 
    def get_by_id(self, user_id: str) -> User | None:
        return self._by_id.get(user_id)
 
    def get_by_username(self, username: str) -> User | None:
        uid = self._by_username.get(username.lower())
        return self._by_id.get(uid) if uid else None
 
    def update_bio(self, user_id: str, bio: str) -> bool:
        user = self._by_id.get(user_id)
        if not user:
            return False
        user.bio = bio
        return True
 
    def delete_user(self, user_id: str) -> bool:
        user = self._by_id.pop(user_id, None)
        if not user:
            return False
        self._by_username.pop(user.username, None)
        return True
 
    def get_many(self, user_ids: list[str]) -> list[User]:
        # Bulk fetch — O(k) where k = len(user_ids).
        return [self._by_id[uid] for uid in user_ids if uid in self._by_id]
 
    def all_users(self) -> list[User]:
        return list(self._by_id.values())
 
    def __len__(self) -> int:
        return len(self._by_id)
