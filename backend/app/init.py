from flask import Flask
from flask_cors import CORS
 
 
def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
 
    from app.store import store
    from app.db import init_chat_db
    store.bootstrap()
    init_chat_db()
 
    from app.routes.auth_route import auth_bp
    from app.routes.Users import users_bp
    from app.routes.friends_route import friends_bp
    from app.routes.search_route import search_bp
    from app.routes.chat_route import chat_bp
 
    app.register_blueprint(auth_bp,    url_prefix="/api/auth")
    app.register_blueprint(users_bp,   url_prefix="/api/users")
    app.register_blueprint(friends_bp, url_prefix="/api/friends")
    app.register_blueprint(search_bp,  url_prefix="/api/search")
    app.register_blueprint(chat_bp,    url_prefix="/api/chat")
 
    @app.route("/api/health")
    def health():
        from app.db import get_db
        with get_db() as conn:
            user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            msg_count  = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
        return {"status": "ok", "users_in_db": user_count, "messages_in_db": msg_count}
 
    return app
 
 
def seed_demo_data():
    """Seed demo users + friendships — skips if already seeded."""
    from app.store import store
    from app.db import db_get_all_users, db_set_password_hash
    from app.auth import hash_password
 
    if db_get_all_users():
        # Users exist — make sure they all have passwords set
        users = db_get_all_users()
        from app.db import db_get_password_hash
        needs_password = [u for u in users if not db_get_password_hash(u["id"])]
        if needs_password:
            demo_hash = hash_password("demo1234")
            for u in needs_password:
                db_set_password_hash(u["id"], demo_hash)
            print(f"[seed] Set password 'demo1234' for {len(needs_password)} existing users.")
        else:
            print("[seed] DB already seeded — skipping.")
        return {}
 
    users_data = [
        ("alice",  "Alice Mwangi",   "alice@demo.com",  "loves hiking and code"),
        ("bob",    "Bob Otieno",     "bob@demo.com",    "basketball fan"),
        ("carol",  "Carol Kamau",    "carol@demo.com",  "designer & artist"),
        ("dave",   "Dave Njoroge",   "dave@demo.com",   "backend engineer"),
        ("eve",    "Eve Wanjiku",    "eve@demo.com",    "data scientist"),
        ("frank",  "Frank Odhiambo", "frank@demo.com",  "musician"),
        ("grace",  "Grace Akinyi",   "grace@demo.com",  "teacher"),
        ("henry",  "Henry Mutua",    "henry@demo.com",  "entrepreneur"),
        ("irene",  "Irene Chebet",   "irene@demo.com",  "nurse"),
        ("james",  "James Kariuki",  "james@demo.com",  "photographer"),
    ]
 
    demo_hash  = hash_password("demo1234")
    registered = {}
    for username, name, email, bio in users_data:
        user = store.register_user(username, name, email, bio, password_hash=demo_hash)
        registered[username] = user.id
 
    friendships = [
        ("alice","bob"),("alice","carol"),("alice","dave"),
        ("bob","carol"),("bob","eve"),
        ("carol","frank"),("carol","grace"),
        ("dave","henry"),("dave","eve"),
        ("eve","irene"),("frank","james"),
        ("grace","henry"),("henry","irene"),("irene","james"),
    ]
    for a, b in friendships:
        store.make_friends(registered[a], registered[b])
 
    print(f"[seed] {len(registered)} users (password: demo1234), {len(friendships)} friendships.")
    return registered