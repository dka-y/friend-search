import os
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify

JWT_SECRET  = os.environ.get("JWT_SECRET", "friendsearch-dev-secret-change-in-prod")
JWT_ALGO    = "HS256"
JWT_EXPIRY_HOURS = 24


def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def generate_token (user_id: str, username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "user_id":  user_id,
        "username": username,
        "iat":      now,
        "exp":      now + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def decode_token(token: str) -> dict | None:
   
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
 
        token = auth_header[len("Bearer "):]
        payload = decode_token(token)
 
        if payload is None:
            return jsonify({"error": "Token expired or invalid. Please log in again."}), 401
 
        return f(*args, current_user_id=payload["user_id"],
                 current_username=payload["username"], **kwargs)
 
    return decorated