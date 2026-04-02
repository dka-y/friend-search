

from flask import Flask, render_template, request, jsonify
import heapq
import time
from collections import deque

app = Flask(__name__)


# 1. CORE DATA STRUCTURES


# Adjacency List: user → set of users they follow
# Hash Map for O(1) membership checks
social_graph: dict[str, set[str]] = {}

# Trie for prefix search
trie: dict = {}

# Stack for undo history  (max 50 entries)
action_stack: list[dict] = []

# 
# 2. SEED DATA (pre-seeded graph)
# 

USERS = ["Alice", "Bob", "Carol", "David", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack"]

INITIAL_FOLLOWS = [
    ("Alice", "Bob"),
    ("Alice", "Carol"),
    ("Bob", "David"),
    ("Bob", "Eve"),
    ("Carol", "David"),
    ("Carol", "Frank"),
    ("David", "Grace"),
    ("Eve", "Frank"),
    ("Eve", "Grace"),
    ("Frank", "Hank"),
    ("Grace", "Ivy"),
    ("Hank", "Jack"),
    ("Ivy", "Jack"),
]

# 
# 3. TRIE OPERATIONS  — O(L) insert, O(L) search
# 

def trie_insert(word: str):
    """Insert a word into the trie character by character."""
    node = trie
    for ch in word.lower():
        if ch not in node:
            node[ch] = {}
        node = node[ch]
    node["$"] = word  # terminal marker stores original-case name


def trie_search(prefix: str) -> list[str]:
    """Return all users whose names start with prefix. O(L + R) where R = results."""
    node = trie
    for ch in prefix.lower():
        if ch not in node:
            return []
        node = node[ch]
    # BFS/DFS to collect all terminals under this prefix node
    results = []
    queue = deque([node])
    while queue:
        curr = queue.popleft()
        for key, val in curr.items():
            if key == "$":
                results.append(val)
            else:
                queue.append(val)
    return results


# 
# 4. GRAPH OPERATIONS
# 

def add_follow(follower: str, followee: str):
    """Add a directed edge follower → followee."""
    social_graph.setdefault(follower, set())
    social_graph.setdefault(followee, set())
    social_graph[follower].add(followee)
    # Push to action stack (undo support)
    action_stack.append({
        "action": "follow",
        "follower": follower,
        "followee": followee,
        "timestamp": time.time()
    })
    if len(action_stack) > 50:
        action_stack.pop(0)


def remove_follow(follower: str, followee: str):
    """Remove a directed edge follower → followee."""
    social_graph.setdefault(follower, set())
    social_graph[follower].discard(followee)
    action_stack.append({
        "action": "unfollow",
        "follower": follower,
        "followee": followee,
        "timestamp": time.time()
    })
    if len(action_stack) > 50:
        action_stack.pop(0)


def get_followers(user: str) -> list[str]:
    """Return all users who follow `user`. O(V) scan."""
    return [u for u, following in social_graph.items() if user in following]


def get_following(user: str) -> list[str]:
    """Return all users that `user` follows. O(1) lookup."""
    return list(social_graph.get(user, set()))


# 
# 5. BFS RECOMMENDATION ENGINE  — friends-of-friends
# 

def bfs_recommendations(me: str, top_k: int = 5) -> list[dict]:
    """
    BFS from `me` to depth-2 neighbours.
    Uses a Hash Map to count mutual-friend occurrences.
    Uses a Max-Heap (negated for min-heap) to extract top-K.
    Complexity: O(V + E) BFS + O(R log K) heap
    """
    my_following: set = social_graph.get(me, set())
    mutual_count: dict[str, int] = {}   # Hash Map: candidate → mutual count

    # BFS: explore depth-1 (people I follow), then depth-2
    visited = {me} | my_following
    queue: deque = deque(my_following)

    while queue:
        friend = queue.popleft()
        for fof in social_graph.get(friend, set()):   # friends-of-friends
            if fof not in visited:
                mutual_count[fof] = mutual_count.get(fof, 0) + 1
                visited.add(fof)
                queue.append(fof)

    # Count mutuals more accurately (how many of my friends also follow this person)
    refined: dict[str, int] = {}
    for candidate in mutual_count:
        count = sum(
            1 for f in my_following
            if candidate in social_graph.get(f, set())
        )
        if count > 0:
            refined[candidate] = count

    # Max-Heap: extract top-K by mutual count
    # heapq is a min-heap, so negate counts
    heap = [(-count, name) for name, count in refined.items()]
    heapq.heapify(heap)

    results = []
    for _ in range(min(top_k, len(heap))):
        neg_count, name = heapq.heappop(heap)
        results.append({"name": name, "count": -neg_count})

    # Merge Sort (Python's TimSort) for stable secondary sort by name
    results = sorted(results, key=lambda x: (-x["count"], x["name"]))
    return results


# 
# 6. UNDO OPERATION  — Stack pop
# 

def undo_last_action(me: str) -> dict | None:
    """
    Pop the last action from the stack and reverse it.
    Only reverses actions made by `me`.
    """
    for i in range(len(action_stack) - 1, -1, -1):
        entry = action_stack[i]
        if entry["follower"] == me:
            action_stack.pop(i)
            # Reverse it
            if entry["action"] == "follow":
                social_graph[me].discard(entry["followee"])
            else:
                social_graph[me].add(entry["followee"])
            return entry
    return None


# 
# 7. INITIALISATION
# 

def init_graph():
    """Reset graph to seed state and rebuild the Trie."""
    global trie, action_stack
    social_graph.clear()
    trie = {}
    action_stack.clear()

    for user in USERS:
        social_graph[user] = set()
        trie_insert(user)

    for follower, followee in INITIAL_FOLLOWS:
        social_graph[follower].add(followee)


init_graph()


# 
# 8. ROUTES
# 

@app.route("/")
def index():
    me = "Alice"
    users = sorted(USERS)
    following = list(social_graph.get(me, set()))
    return render_template("index.html", users=users, following=following, me=me)


@app.route("/user_stats/<name>")
def user_stats(name: str):
    following_list = sorted(get_following(name))
    followers_list = get_followers(name)
    return jsonify({
        "name": name,
        "following_count": len(following_list),
        "follower_count": len(followers_list),
        "following_list": following_list
    })


@app.route("/follow", methods=["POST"])
def follow():
    data = request.json
    me, target = data["me"], data["target"]
    add_follow(me, target)
    return jsonify({
        "ok": True,
        "following_list": sorted(get_following(me))
    })


@app.route("/unfollow", methods=["POST"])
def unfollow():
    data = request.json
    me, target = data["me"], data["target"]
    remove_follow(me, target)
    return jsonify({
        "ok": True,
        "following_list": sorted(get_following(me))
    })


@app.route("/recommendations/<user>")
def recommendations(user: str):
    recs = bfs_recommendations(user)
    return jsonify(recs)


@app.route("/search")
def search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify(USERS)
    results = trie_search(q)
    return jsonify(results)


@app.route("/undo", methods=["POST"])
def undo():
    data = request.json
    me = data.get("me", "Alice")
    result = undo_last_action(me)
    if result:
        return jsonify({
            "ok": True,
            "undone": result,
            "following_list": sorted(get_following(me))
        })
    return jsonify({"ok": False, "message": "Nothing to undo"})


@app.route("/graph_data")
def graph_data():
    """Return full graph for visualization."""
    nodes = [{"id": u} for u in USERS]
    edges = []
    for u, following in social_graph.items():
        for v in following:
            edges.append({"source": u, "target": v})
    return jsonify({"nodes": nodes, "edges": edges})


@app.route("/history")
def history():
    """Return the action stack (most recent first)."""
    return jsonify(list(reversed(action_stack[-20:])))


@app.route("/complexity")
def complexity():
    """Return Big-O notes for each operation."""
    return jsonify({
        "follow_unfollow": "O(1) — hash set insert/delete",
        "bfs_recommendation": "O(V + E) BFS + O(R log K) heap",
        "trie_search": "O(L + R) where L=prefix length, R=results",
        "get_followers": "O(V) — linear scan of all users",
        "get_following": "O(1) — direct set lookup",
        "undo": "O(1) — stack pop",
        "top_k_heap": "O(R log K) where R=candidates, K=top-k",
        "sorted_output": "O(R log R) — TimSort (merge sort based)"
    })


@app.route("/reset", methods=["POST"])
def reset():
    init_graph()
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(debug=True, port=5000)