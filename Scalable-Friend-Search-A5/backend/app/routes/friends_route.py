from flask import Blueprint, request, jsonify
from app.store import store
from app.auth import require_auth


friends_bp = Blueprint("friends", __name__)
 
 
@friends_bp.route("/request", methods=["POST"])
@require_auth
def send_request(current_user_id, current_username):
    data    = request.get_json() or {}
    to_user = data.get("to_user", "")
 
    if not to_user:
        return jsonify({"error": "to_user required"}), 400
    if current_user_id == to_user:
        return jsonify({"error": "Cannot friend yourself"}), 400
    if store.are_friends(current_user_id, to_user):
        return jsonify({"error": "Already friends"}), 409
 
    req = store.send_request(current_user_id, to_user)
    if not req:
        return jsonify({"error": "Request already pending"}), 409
 
    return jsonify({"message": "Friend request sent", "request": {
        "from_user": req.from_user,
        "to_user":   req.to_user,
        "timestamp": req.timestamp,
        "status":    req.status,
    }}), 201
 
 
@friends_bp.route("/accept", methods=["POST"])
@require_auth
def accept_request(current_user_id, current_username):
    data      = request.get_json() or {}
    from_user = data.get("from_user", "")
    # current user is the receiver — they accept the incoming request
    ok = store.accept_request(from_user, current_user_id)
    if not ok:
        return jsonify({"error": "No pending request found"}), 404
    return jsonify({"message": "Friend request accepted"})
 
 
@friends_bp.route("/reject", methods=["POST"])
@require_auth
def reject_request(current_user_id, current_username):
    data      = request.get_json() or {}
    from_user = data.get("from_user", "")
    ok = store.reject_request(from_user, current_user_id)
    if not ok:
        return jsonify({"error": "No pending request found"}), 404
    return jsonify({"message": "Friend request rejected"})
 
 
@friends_bp.route("/pending", methods=["GET"])
@require_auth
def pending_requests(current_user_id, current_username):
    rows   = store.get_pending_for_user(current_user_id)
    result = []
    for row in rows:
        sender = store.get_user_by_id(row["from_user"])
        result.append({
            "from_user":       row["from_user"],
            "sender_name":     sender.display_name if sender else "Unknown",
            "sender_username": sender.username     if sender else "",
            "timestamp":       row["created_at"],
        })
    return jsonify({"pending": result})
 
 
@friends_bp.route("/mutual/<other_user_id>", methods=["GET"])
@require_auth
def mutual_friends(current_user_id, current_username, other_user_id: str):
    mutual_ids = store.graph.mutual_friends(current_user_id, other_user_id)
    users      = store.get_users_by_ids(mutual_ids)
    return jsonify({"mutual_friends": [u.to_dict() for u in users]})
 
 
@friends_bp.route("/suggestions", methods=["GET"])
@require_auth
def friend_suggestions(current_user_id, current_username):
    degrees       = store.graph.bfs_degrees(current_user_id, max_depth=2)
    friends       = set(store.get_friends(current_user_id))
    candidate_ids = [uid for uid, deg in degrees.items() if deg == 2 and uid not in friends]
 
    users       = store.get_users_by_ids(candidate_ids)
    suggestions = []
    for u in users:
        d = u.to_dict()
        d["mutual_friends"] = store.graph.mutual_friend_count(current_user_id, u.id)
        suggestions.append(d)
 
    suggestions.sort(key=lambda x: -x["mutual_friends"])
    return jsonify({"suggestions": suggestions[:10]})
 
 
@friends_bp.route("/unfriend", methods=["POST"])
@require_auth
def unfriend(current_user_id, current_username):
    data    = request.get_json() or {}
    user_b  = data.get("user_id", "")
    store.unfriend(current_user_id, user_b)
    return jsonify({"message": "Unfriended"})


    