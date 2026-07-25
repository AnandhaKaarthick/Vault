from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Body
from pydantic import BaseModel
from backend.services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


@router.post("/register")
async def register_user(body: RegisterRequest):
    """Registers a new user account."""
    try:
        res = auth_service.register(
            username=body.username,
            email=body.email,
            password=body.password,
            full_name=body.full_name
        )
        return {
            "status": "success",
            "message": "Account created successfully.",
            "token": res["token"],
            "user": res["user"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login_user(body: LoginRequest):
    """Authenticates user login credentials."""
    try:
        res = auth_service.login(
            username_or_email=body.username_or_email,
            password=body.password
        )
        return {
            "status": "success",
            "message": "Login successful.",
            "token": res["token"],
            "user": res["user"]
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Retrieves current user profile from token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    token = authorization.replace("Bearer ", "").strip()
    user = auth_service.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid token.")

    return user
