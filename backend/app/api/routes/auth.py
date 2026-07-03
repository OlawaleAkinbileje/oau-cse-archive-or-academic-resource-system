from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import LoginValidationRequest, LoginValidationResponse, SignupRequest, SignupResponse
from app.schemas.user import UserResponse
from app.services.auth_service import register_user_profile, validate_supabase_session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginValidationResponse)
def login(payload: LoginValidationRequest, db: Session = Depends(get_db)):
    user = validate_supabase_session(db, payload.access_token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")
    return LoginValidationResponse(user=UserResponse.model_validate(user), is_valid=True)


@router.post("/signup", response_model=SignupResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    user, message = register_user_profile(
        db,
        user_id=payload.user_id,
        email=payload.email,
        full_name=payload.full_name,
        requested_role=payload.requested_role,
    )
    return SignupResponse(user=UserResponse.model_validate(user), message=message)


# Temporary admin route to mark user as staff for testing
@router.post("/make-staff", tags=["admin"])
def make_staff(email: str, db: Session = Depends(get_db)):
    from app.models.user import User
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = "staff"
    user.status = "active"
    user.is_staff_verified = True
    db.commit()
    db.refresh(user)
    return {"message": f"User {email} marked as verified staff", "user": UserResponse.model_validate(user)}
