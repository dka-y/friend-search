from flask import Blueprint, request, jsonify

users_bp = Blueprint("users", __name__)

@users_bp.route("/register", method=["POST"])

def register():
    data = request.get_json()
    username = data.get("username", "").strip ()
    display_name = data.get("display_name", "").strip()
    email = data.get("email", "").strip()
    bio = data.get("bio", "").strip()

    if not username or not display_name or not email:
        return jsonify ({
            "error": "username, display_name and email required"
        }), 400

    try:
        user = 



















