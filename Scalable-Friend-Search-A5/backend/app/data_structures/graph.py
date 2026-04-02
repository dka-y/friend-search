from collections import deque
class FriendGraph:
    def __init__(self):
        self.adj: dict[str, set[str]] = {}

    def add_user(self, user_id: str) -> None:
            if user_id not in self.adj:
                self.adj[user_id] = set()

    def remove_user(self, user_id: str) -> None:
            if user_id in self.adj:
                for friend_id in list(self.adj[user_id]):
                    self.adj[friend_id].discard(user_id)
                del self.adj[user_id]

    def add_friendship(self, user_a: str, user_b: str) -> None:
        
        self.add_user(user_a)
        self.add_user(user_b)
        self.adj[user_a].add(user_b)
        self.adj[user_b].add(user_a)
 
    def remove_friendship(self, user_a: str, user_b: str) -> None:
        self.adj.get(user_a, set()).discard(user_b)
        self.adj.get(user_b, set()).discard(user_a)
 
    def get_friends(self, user_id: str) -> list[str]:
        return list(self.adj.get(user_id, set()))
 
    def mutual_friends(self, user_a: str, user_b: str) -> list[str]:
        
        set_a = self.adj.get(user_a, set())
        set_b = self.adj.get(user_b, set())
        return list(set_a & set_b)
 
    def mutual_friend_count(self, user_a: str, user_b: str) -> int:
        return len(self.mutual_friends(user_a, user_b))
 
    def bfs_degrees(self, source: str, max_depth: int = 3) -> dict[str, int]:
        
        if source not in self.adj:
            return {}
        visited = {source: 0}
        queue = deque([source])
        while queue:
            current = queue.popleft()
            depth = visited[current]
            if depth >= max_depth:
                continue
            for neighbor in self.adj.get(current, []):
                if neighbor not in visited:
                    visited[neighbor] = depth + 1
                    queue.append(neighbor)
        visited.pop(source, None)
        return visited
 
    def shortest_path(self, source: str, target: str) -> list[str]:
        """BFS shortest path between two users. Returns list of user_ids."""
        if source not in self.adj or target not in self.adj:
            return []
        if source == target:
            return [source]
        parent: dict[str, str | None] = {source: None}
        queue = deque([source])
        while queue:
            current = queue.popleft()
            if current == target:
                path = []
                while current is not None:
                    path.append(current)
                    current = parent[current]
                return path[::-1]
            for neighbor in self.adj.get(current, []):
                if neighbor not in parent:
                    parent[neighbor] = current
                    queue.append(neighbor)
        return []  # no path found
 
    def are_friends(self, user_a: str, user_b: str) -> bool:
        return user_b in self.adj.get(user_a, set())