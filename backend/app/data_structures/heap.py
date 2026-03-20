import heapq
from dataclasses import dataclass

@dataclass
class RankedUser:
    user_id: str
    score: int
    username: str = ""
    display_name: str = ""

    def __lt__ (self, other: "RankedUser") -> bool:
        return self.score > other.score

class SearchResultHeap:
    # max heap by score, bounded to top k elements using min heap trick
    def __init__ (self, k: int = 10):
        self.k = k
        self._heap: list[tuple[int, str, RankedUser]] = []

    def push (self, user: RankedUser) ->None:
        entry = (user.score, user.user_id, user)
        heapq.heappush(self._heap, entry)
        if len(self._heap) > self.k:
            heapq.heappop(self._heap)

    def get_top_k(self) -> list[RankedUser]:
        sorted_entries = sorted(self._heap, key = lambda x: -x[0])
        return [entry[2] for entry in sorted_entries]
        
    def clear(self) -> None:
        self._heap.clear()

    def __len__(self) -> int:
        return len(self._heap)

def rank_search_results(candidates: list[dict], mutual_counts: dict[str, int], k: int = 10) -> list[dict]:
    
    heap = SearchResultHeap(k=k)
    for user in candidates:
        uid = user["id"]
        score = mutual_counts.get(uid, 0)
        heap.push(RankedUser(
            user_id=uid,
            score=score,
            username=user.get("username", ""),
            display_name=user.get("display_name", "")
        ))
    ranked = heap.get_top_k()
    return [
        {
            "id": r.user_id,
            "username": r.username,
            "display_name": r.display_name,
            "mutual_friends": r.score
        }
        for r in 

    ]