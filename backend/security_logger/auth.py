"""Authentication utilities: password hashing, JWT tokens, and auth middleware."""

import os
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import UserModel

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.environ.get("JWT_EXPIRY_HOURS", "24"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user: UserModel) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])


def auth_required(allowed_roles=None):
    if allowed_roles is None:
        allowed_roles = ["admin", "viewer"]

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing or invalid Authorization header"}), 401

            token = auth_header.split(" ", 1)[1]
            try:
                payload = decode_token(token)
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401

            user_role = payload.get("role")
            if user_role not in allowed_roles:
                return jsonify({"error": "Forbidden"}), 403

            g.user = payload
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_user_by_email(db: Session, email: str) -> UserModel:
    return db.query(UserModel).filter(UserModel.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> UserModel:
    return db.query(UserModel).filter(UserModel.id == user_id).first()


def create_user(db: Session, email: str, password: str, full_name: str = None, role: str = "viewer") -> UserModel:
    user = UserModel(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def ensure_admin_exists():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    db = SessionLocal()
    try:
        existing = get_user_by_email(db, admin_email)
        if not existing:
            create_user(db, admin_email, admin_password, "Administrator", "admin")
            print(f"Created default admin user: {admin_email}")
        return admin_email
    finally:
        db.close()
