import os
import json
import uuid
import hashlib
import datetime
from typing import Dict, Any, List, Optional

if os.environ.get("VERCEL"):
    STORAGE_DIR = "/tmp/storage"
else:
    STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")

try:
    os.makedirs(STORAGE_DIR, exist_ok=True)
except Exception as e:
    print(f"[AuthService] Storage directory creation notice: {e}")

USERS_JSON_PATH = os.path.join(STORAGE_DIR, "users.json")


def hash_password(password: str) -> str:
    """Hashes password with SHA-256 and static salt."""
    salt = "docvault_secure_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()


class AuthService:
    """
    Manages user registration, authentication, sessions, and multi-tenant user stores.
    Persists user accounts to backend/storage/users.json.
    """
    def __init__(self):
        self._users: Dict[str, Dict[str, Any]] = {}
        self._tokens: Dict[str, str] = {} # token -> user_id
        self._load_users()
        self._seed_default_users()

    def _load_users(self):
        if os.path.exists(USERS_JSON_PATH):
            try:
                with open(USERS_JSON_PATH, "r", encoding="utf-8") as f:
                    self._users = json.load(f)
                print(f"[AuthService] Loaded {len(self._users)} user accounts from local disk.")
            except Exception as e:
                print(f"[AuthService] Error loading users DB: {e}")

    def _save_users(self):
        try:
            with open(USERS_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(self._users, f, indent=2)
        except Exception as e:
            print(f"[AuthService] Error saving users DB: {e}")

    def _seed_default_users(self):
        """Seeds default accounts including Demo User if missing."""
        demo_user_rec = {
            "id": "usr_demo",
            "username": "demo",
            "email": "demo@docvault.io",
            "full_name": "Demo Vault User",
            "password_hash": hash_password("demo123"),
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        if "usr_demo" not in self._users:
            self._users["usr_demo"] = demo_user_rec
            self._save_users()

    def register(self, username: str, email: str, password: str, full_name: Optional[str] = None) -> Dict[str, Any]:
        username_clean = username.strip().lower()
        email_clean = email.strip().lower()

        for u in self._users.values():
            if u["username"].lower() == username_clean:
                raise ValueError("Username already taken. Please choose another username.")
            if u["email"].lower() == email_clean:
                raise ValueError("Email address already registered. Please login instead.")

        user_id = f"usr_{uuid.uuid4().hex[:8]}"
        user_record = {
            "id": user_id,
            "username": username.strip(),
            "email": email_clean,
            "full_name": full_name.strip() if full_name else username.strip(),
            "password_hash": hash_password(password),
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        self._users[user_id] = user_record
        self._save_users()

        token = f"tok_{uuid.uuid4().hex}"
        self._tokens[token] = user_id

        return {
            "token": token,
            "user": {
                "id": user_id,
                "username": user_record["username"],
                "email": user_record["email"],
                "full_name": user_record["full_name"]
            }
        }

    def login(self, username_or_email: str, password: str) -> Dict[str, Any]:
        ident = username_or_email.strip().lower()
        pass_clean = password.strip()

        # Check for Demo Account 1-Click Flexible Match
        if ident in ["demo", "demo_user", "demouser", "demo@docvault.io"]:
            user_rec = self._users.get("usr_demo")
            if not user_rec:
                self._seed_default_users()
                user_rec = self._users["usr_demo"]

            token = f"tok_{uuid.uuid4().hex}"
            self._tokens[token] = "usr_demo"
            return {
                "token": token,
                "user": {
                    "id": "usr_demo",
                    "username": user_rec["username"],
                    "email": user_rec["email"],
                    "full_name": user_rec["full_name"]
                }
            }

        pass_hash = hash_password(password)
        target_user = None
        for u in self._users.values():
            if u["username"].lower() == ident or u["email"].lower() == ident:
                target_user = u
                break

        if not target_user:
            raise ValueError("User account not found. Please check your username or register.")

        if target_user["password_hash"] != pass_hash:
            raise ValueError("Invalid password provided. Access denied.")

        user_id = target_user["id"]
        token = f"tok_{uuid.uuid4().hex}"
        self._tokens[token] = user_id

        return {
            "token": token,
            "user": {
                "id": user_id,
                "username": target_user["username"],
                "email": target_user["email"],
                "full_name": target_user["full_name"]
            }
        }

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        user_id = self._tokens.get(token)
        if not user_id:
            return None
        
        user_rec = self._users.get(user_id)
        if not user_rec:
            return None

        return {
            "id": user_rec["id"],
            "username": user_rec["username"],
            "email": user_rec["email"],
            "full_name": user_rec["full_name"]
        }

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        user_rec = self._users.get(user_id)
        if not user_rec:
            return None
        return {
            "id": user_rec["id"],
            "username": user_rec["username"],
            "email": user_rec["email"],
            "full_name": user_rec["full_name"]
        }


auth_service = AuthService()
