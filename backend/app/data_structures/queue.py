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