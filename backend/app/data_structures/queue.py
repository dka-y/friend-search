# use queue for friend request

from collections import deque
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class FriendRequest:
    from_user: str
    to_user: str
    timestamp: str = field(default_factory = lambda: datetime.utcnow().isformat())
    status: str = "pending"

class FriendRequestQueue:
    def __init__(self):
        self._queue: deque[FriendRequest] = deque()
        # lookup index
        self._index: dict[tuple[str,str], FriendRequest] = {}
    # add friend request
    def enqueue (self, from_user: str, to_user: str) -> FriendRequest | None:
        key = (from_user, to_user)
        if key in self._index:
            return None
        req = FriendRequest(from_user= from_user, to_user=to_user)
        self._queue.append(req)
        self._index[key] = req
        return req
    
    #process old request
    def dequeue (self) -> FriendRequest | None:
        while self._queue:
            req = self._queue.popleft()
             self._index.pop((req.from_user, req.to_user), None)
            return req
        return None
    
    def peek (self) -> FriendRequest | None:
        return self._queue[0] if self._queue else None
    

    def get_pending_for_user(self, user_id: str) -> list[FriendRequest]:
        return [r for r in self._queue if r.to_user == user_id and r.status = "pending"]

    def get_sent_by_user (self, user_id: str) -> list[FriendRequest]:
        return [r for r in self._queue if r.from_user == user_id]

    def remove_request(self, from_user: str, to_user:str) -> bool:
        key = (from_user, to_user)
        if key not in self._index:
            return False
        req = self._index.pop(key)
        try:
            self._queue.remove(req)
        except ValueError:
            pass
        return True

    def __len__( self) -> int:
        return len(self._queue)


# message 
@dataclass
class Message:
    """A single chat message."""
    id:          str
    sender_id:   str
    receiver_id: str
    content:     str
    timestamp:   str = field(default_factory=lambda: datetime.utcnow().isoformat())
    read:        bool = False
 
    def to_dict(self) -> dict:
        return {
            "id":          self.id,
            "sender_id":   self.sender_id,
            "receiver_id": self.receiver_id,
            "content":     self.content,
            "timestamp":   self.timestamp,
            "read":        self.read,
        }
class MessageQueue:

    MAX_BUFFER = 50  # max messages buffered per conversation in memory
 
    def __init__(self):
        # conversation_key -> deque of Message (bounded buffer)
        self._queues: dict[frozenset, deque] = {}
        # unread counts: (receiver_id, conv_key) -> int
        self._unread: dict[tuple, int] = {}
 
    def _key(self, user_a: str, user_b: str) -> frozenset:
        return frozenset({user_a, user_b})
 
    def enqueue(self, message: "Message") -> None:
        
        key = self._key(message.sender_id, message.receiver_id)
        if key not in self._queues:
            self._queues[key] = deque(maxlen=self.MAX_BUFFER)
        self._queues[key].append(message)
        unread_key = (message.receiver_id, key)
        self._unread[unread_key] = self._unread.get(unread_key, 0) + 1
 
    def peek_latest(self, user_a: str, user_b: str) -> "Message | None":
        
        key = self._key(user_a, user_b)
        q = self._queues.get(key)
        return q[-1] if q else None
 
    def mark_read(self, reader_id: str, user_a: str, user_b: str) -> None:
      
        key = self._key(user_a, user_b)
        self._unread[(reader_id, key)] = 0
 
    def unread_count(self, receiver_id: str, user_a: str, user_b: str) -> int:
        
        key = self._key(user_a, user_b)
        return self._unread.get((receiver_id, key), 0)
 
    def total_unread_for_user(self, user_id: str) -> int:
        
        return sum(v for (uid, _), v in self._unread.items() if uid == user_id)
 
    def get_conversation_keys(self, user_id: str) -> list:
        return [k for k in self._queues if user_id in k]
 
    def clear_buffer(self, user_a: str, user_b: str) -> None:
        self._queues.pop(self._key(user_a, user_b), None)
