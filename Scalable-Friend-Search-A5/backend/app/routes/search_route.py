from flask import Blueprint, request, jsonify
from app.store import store
from app.data_structures.heap import rank_search_results
from app.auth import require_auth
 
search_bp = Blueprint("search", __name__)
 
 
@search_bp.route("/autocomplete", methods=["GET"])
@require_auth
def autocomplete(current_user_id, current_username):
    prefix = request.args.get("q", "").strip()
 
    if len(prefix) < 1:
        return jsonify({"results": []})
 
    # 1. Trie lookup 
    raw_ids = store.trie.autocomplete(prefix, limit=50)
    seen = set()
    matching_ids = []
    for uid in raw_ids:
        if uid != current_user_id and uid not in seen:
            seen.add(uid)
            matching_ids.append(uid)
 
    if not matching_ids:
        return jsonify({"results": []})
 
    # 2. SQLite bulk fetch 
    users = store.get_users_by_ids(matching_ids)
 
    # 3. Mutual friend counts via Graph 
    mutual_counts = {
        u.id: store.graph.mutual_friend_count(current_user_id, u.id)
        for u in users
    }
 
    # 4. Rank with Heap )
    candidates = [u.to_dict() for u in users]
    ranked = rank_search_results(candidates, mutual_counts, k=10)
 
    # 5. Record in history Stack
    if prefix:
        store.record_search(current_user_id, prefix)
 
    # 6. Flag friendship / pending state
    sent = {r["from_user"] for r in store.get_sent_by_user(current_user_id)}
    for r in ranked:
        r["is_friend"] = store.are_friends(current_user_id, r["id"])
        r["request_pending"] = r["id"] in sent
 
    return jsonify({"results": ranked, "query": prefix})
 
 
@search_bp.route("/history", methods=["GET"])
@require_auth
def search_history(current_user_id, current_username):
    history = store.get_search_history(current_user_id)
    return jsonify({"history": list(reversed(history))})
 
 
@search_bp.route("/history/undo", methods=["POST"])
@require_auth
def undo_search(current_user_id, current_username):
    removed = store.undo_search(current_user_id)
    return jsonify({"removed": removed})