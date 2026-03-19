from flask import flask
from flask_cors import CORS 

def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
