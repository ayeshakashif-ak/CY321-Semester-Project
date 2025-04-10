# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.config.from_object('config.Config')  # Load config from config.py
CORS(app)

jwt = JWTManager(app)
db.init_app(app)  # Initialize the SQLAlchemy instance

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'msg': 'Email already exists'}), 400

    hashed = generate_password_hash(data['password'])
    new_user = User(email=data['email'], password=hashed)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'msg': 'User created'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.email)
        return jsonify(access_token=access_token)

    return jsonify({'msg': 'Invalid credentials'}), 401

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    return jsonify({'msg': 'You are authorized'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables if they don't exist yet
    app.run(debug=True)
