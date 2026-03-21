from flask import Blueprint, request, jsonify
from app.store import store
from app.auth import require_auth

users_bp = Blueprint("users", __name__)



@users_bp.route("/<user_id>", methods=["GET"])
@require_auth
def get_user(current_user_id, current_username, user_id: str):
    user = store.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    friends = store.get_friends(user_id)
    profile = user.to_dict()
    profile["friend_count"] = len(friends)
    profile["is_friend"] = store.are_friends(current_user_id, user_id)
    return jsonify({"user": profile})


@users_bp.route("/<user_id>/friends", methods=["GET"])
@require_auth
def get_friends(current_user_id, current_username, user_id: str):
    friend_ids = store.get_friends(user_id)
    friends = store.get_users_by_ids(friend_ids)
    return jsonify({"friends": [f.to_dict() for f in friends]})
 
 
@users_bp.route("/", methods=["GET"])
@require_auth
def list_users(current_user_id, current_username):
    users = store.all_users()
    return jsonify({"users": [u.to_dict() for u in users], "count": len(users)})
 
 
@users_bp.route("/me/bio", methods=["PATCH"])
@require_auth
def update_bio(current_user_id, current_username):
    data = request.get_json() or {}
    bio  = data.get("bio", "").strip()
    store.update_bio(current_user_id, bio)
    return jsonify({"ok": True})




















