from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.supabase_client import get_supabase_client
from app.models.user import User


def _decode_token(token: str) -> dict:
    print("DEBUG - _decode_token called! Using Supabase's get_user method...")
    
    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            print("DEBUG - No user found in Supabase for this token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token"
            )
        
        decoded = {
            "sub": user_response.user.id,
            "email": user_response.user.email
        }
        print("DEBUG - Got user from Supabase:", decoded)
        return decoded
    except Exception as e:
        print(f"DEBUG - Supabase token validation error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired access token: {str(e)}",
        ) from e


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    print("DEBUG - get_current_user called! authorization header:", authorization[:50] if authorization else "NO HEADER")
    if not authorization or not authorization.startswith("Bearer "):
        print("DEBUG - No valid authorization header!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header with Bearer token is required",
        )

    token = authorization.replace("Bearer ", "", 1).strip()
    payload = _decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        print("DEBUG - No user_id in payload!")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    print("DEBUG - Looking for user with id:", user_id)
    user = db.query(User).filter(User.id == user_id).first()
    print("DEBUG - Found user:", user)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return user


def require_role(*allowed_roles: str) -> Callable:
    def _role_guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}",
            )
        return current_user

    return _role_guard


def require_staff_role(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "staff" or not getattr(current_user, "is_staff_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only departmental staff are authorized to upload materials.",
        )
    return current_user


def get_current_profile(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header with Bearer token is required",
        )

    token = authorization.replace("Bearer ", "", 1).strip()
    payload = _decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    supabase = get_supabase_client()
    response = supabase.table("profiles").select("id, role").eq("id", user_id).limit(1).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return rows[0]


def verify_staff_status(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
) -> User:
    print("DEBUG - verify_staff_status called! authorization header:", authorization[:50] if authorization else "NO HEADER")
    if not authorization or not authorization.startswith("Bearer "):
        print("DEBUG - verify_staff_status: No valid authorization header!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header with Bearer token is required",
        )
    token = authorization.replace("Bearer ", "", 1).strip()
    payload = _decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        print("DEBUG - verify_staff_status: No user_id in payload!")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    print("DEBUG - verify_staff_status: Looking for user with id:", user_id)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print("DEBUG - verify_staff_status: No user found!")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    print("DEBUG - verify_staff_status: User found:", user)
    if user.role != "staff" or not user.is_staff_verified:
        print("DEBUG - verify_staff_status: Not verified staff!")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "Unauthorized",
                "message": "Only OAU Staff accounts can upload resources.",
            },
        )
    return user


def require_staff_profile(user: User = Depends(verify_staff_status)) -> User:
    return user
