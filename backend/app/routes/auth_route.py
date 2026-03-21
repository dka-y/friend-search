from flask import Blueprint, request, jsonify
from app.store import store
from app.auth import hash_password, verify_password, generate_token

auth_bp = Blueprint("auth", __name__)


 
@auth_bp.route("/register", methods=["POST"])
def register():
  
    data         = request.get_json() or {}
    username     = data.get("username", "").strip()
    display_name = data.get("display_name", "").strip()
    email        = data.get("email", "").strip()
    password     = data.get("password", "")
    bio          = data.get("bio", "").strip()
 
    # Validation
    if not username or not display_name or not email or not password:
        return jsonify({"error": "username, display_name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if " " in username:
        return jsonify({"error": "Username cannot contain spaces"}), 400
 
    try:
        password_hash = hash_password(password)
        user = store.register_user(username, display_name, email, bio, password_hash)
        token = generate_token(user.id, user.username)
        return jsonify({
            "user":  user.to_dict(include_email=True),
            "token": token,
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409

 
@auth_bp.route("/login", methods=["POST"])
def login():
    
    # POST /api/auth/login
    # Body: { username, password }
    # Returns: { user, token }
    
    data     = request.get_json() or {}
    username = data.get("username", "").strip().lower()
    password = data.get("password", "")
 
    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400
 
    user = store.get_user_by_username(username)
    if not user:
        return jsonify({"error": "Invalid username or password"}), 401
 
    # Fetch password hash from DB
    from app.db import db_get_password_hash
    stored_hash = db_get_password_hash(user.id)
    if not stored_hash:
        return jsonify({"error": "Account has no password set. Contact support."}), 401
 
    if not verify_password(password, stored_hash):
        return jsonify({"error": "Invalid username or password"}), 401
 
    token = generate_token(user.id, user.username)
    friends = store.get_friends(user.id)
    profile = user.to_dict(include_email=True)
    profile["friend_count"] = len(friends)
 
    return jsonify({
        "user":  profile,
        "token": token,
    })


@auth_bp.route("/me", methods=["GET"])
def me():
    
    # GET /api/auth/me
    # Validates a token and returns the current user.
    # Used by frontend on page load to restore session.
    
    from app.auth import require_auth, decode_token
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Not authenticated"}), 401
 
    token = auth_header[len("Bearer "):]
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Token expired or invalid"}), 401
 
    user = store.get_user_by_id(payload["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404
 
    friends = store.get_friends(user.id)
    profile = user.to_dict(include_email=True)
    profile["friend_count"] = len(friends)
    return jsonify({"user": profile, "token": token})