import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from app.store import store
from app.auth import require_auth
from app.db import (
    db_insert_message, db_get_conversation, db_get_conversations_for_user,
    db_mark_messages_read, db_unread_count, db_total_unread,
    db_get_messages_since,
)
from app.data_structures.queue import Message
 
chat_bp = Blueprint("chat", __name__)
 
 
def _row_to_msg(row) -> dict:
    return {
        "id":          row["id"],
        "sender_id":   row["sender_id"],
        "receiver_id": row["receiver_id"],
        "content":     row["content"],
        "timestamp":   row["timestamp"],
        "read":        bool(row["read"]),
    }
 
 
@chat_bp.route("/send", methods=["POST"])
@require_auth
def send_message(current_user_id, current_username):
    data        = request.get_json() or {}
    receiver_id = data.get("receiver_id", "").strip()
    content     = data.get("content", "").strip()
 
    if not receiver_id or not content:
        return jsonify({"error": "receiver_id and content are required"}), 400
    if current_user_id == receiver_id:
        return jsonify({"error": "Cannot message yourself"}), 400
    if len(content) > 1000:
        return jsonify({"error": "Message too long (max 1000 chars)"}), 400
    if not store.are_friends(current_user_id, receiver_id):
        return jsonify({"error": "You can only message friends"}), 403
 
    msg_id    = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
 
    db_insert_message(msg_id, current_user_id, receiver_id, content, timestamp)
 
    msg = Message(id=msg_id, sender_id=current_user_id,
                  receiver_id=receiver_id, content=content, timestamp=timestamp)
    store.message_queue.enqueue(msg)
 
    return jsonify({"message": msg.to_dict()}), 201
 
 
@chat_bp.route("/<other_user_id>", methods=["GET"])
@require_auth
def get_conversation(current_user_id, current_username, other_user_id: str):
    limit = int(request.args.get("limit", 50))
    rows  = db_get_conversation(current_user_id, other_user_id, limit=limit)
    messages = [_row_to_msg(r) for r in rows]
 
    # Mark as read
    db_mark_messages_read(current_user_id, other_user_id)
    store.message_queue.mark_read(current_user_id, current_user_id, other_user_id)
 
    return jsonify({"messages": messages, "count": len(messages)})
 
 
@chat_bp.route("/poll/<other_user_id>", methods=["GET"])
@require_auth
def poll_new_messages(current_user_id, current_username, other_user_id: str):
    since = request.args.get("since", "1970-01-01T00:00:00")
    rows  = db_get_messages_since(current_user_id, other_user_id, since)
    messages = [_row_to_msg(r) for r in rows]
 
    new_for_me = [m for m in messages if m["receiver_id"] == current_user_id]
    if new_for_me:
        db_mark_messages_read(current_user_id, other_user_id)
        store.message_queue.mark_read(current_user_id, current_user_id, other_user_id)
 
    return jsonify({"messages": messages, "count": len(messages)})
 
 
@chat_bp.route("/conversations", methods=["GET"])
@require_auth
def get_conversations(current_user_id, current_username):
    rows   = db_get_conversations_for_user(current_user_id)
    result = []
    for row in rows:
        other_id = row["other_user"]
        other    = store.get_user_by_id(other_id)
        unread   = db_unread_count(current_user_id, other_id)
        result.append({
            "other_user_id":      other_id,
            "other_display_name": other.display_name if other else "Unknown",
            "other_username":     other.username     if other else "",
            "last_message":       row["content"],
            "last_timestamp":     row["timestamp"],
            "unread_count":       unread,
            "last_sender_is_me":  row["sender_id"] == current_user_id,
        })
    return jsonify({"conversations": result})
 
 
@chat_bp.route("/unread", methods=["GET"])
@require_auth
def total_unread(current_user_id, current_username):
    count = db_total_unread(current_user_id)
    return jsonify({"unread": count})