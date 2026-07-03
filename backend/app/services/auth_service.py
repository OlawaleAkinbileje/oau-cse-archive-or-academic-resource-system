from jose import JWTError, jwt
from sqlalchemy.orm import Session
from supabase import create_client, Client

from app.core.config import settings
from app.models.user import User

# Valid staff email domains
STAFF_EMAIL_DOMAINS = ["@oauife.edu.ng", "@pg-student.oauife.edu.ng"]


def validate_supabase_session(db: Session, access_token: str) -> User | None:
    try:
        # Use Supabase client to get user info directly from Supabase Auth
        user_response = supabase.auth.get_user(access_token)
        if not user_response.user:
            print("No user found in Supabase for this token")
            return None
        
        user_id = user_response.user.id
        email = user_response.user.email
        full_name = user_response.user.user_metadata.get("full_name") if user_response.user.user_metadata else None
        
    except Exception as e:
        print(f"Supabase token validation error: {str(e)}")
        return None

    user = db.query(User).filter(User.id == user_id).first()
    
    if not user and email:
        # Lazy creation of user profile if it doesn't exist yet
        try:
            user, _ = register_user_profile(
                db,
                user_id=user_id,
                email=email,
                full_name=full_name
            )
        except Exception as e:
            print(f"Lazy profile creation failed: {e}")
            return None
        
    return user


def register_user_profile(
    db: Session,
    *,
    user_id: str,
    email: str,
    full_name: str | None = None,
    requested_role: str | None = None,
) -> tuple[User, str]:
    normalized_email = email.strip().lower()
    existing_user = db.query(User).filter(User.id == user_id).first()

    is_department_email = any(normalized_email.endswith(domain) for domain in STAFF_EMAIL_DOMAINS)
    # Never allow direct staff assignment via signup payload.
    role = "student"
    is_staff_verified = False
    if is_department_email:
        status = "Pending Staff Verification"
        message = "Registration submitted. Account is pending staff verification by a super-admin."
    else:
        status = "active"
        message = "Registration completed as student."

    if requested_role and requested_role.lower() == "staff":
        message += " Staff role requests must be approved directly by a super-admin in the database."

    if existing_user:
        existing_user.email = normalized_email
        existing_user.full_name = full_name
        existing_user.role = role
        existing_user.status = status
        existing_user.is_staff_verified = is_staff_verified
        db.commit()
        db.refresh(existing_user)
        return existing_user, message

    user = User(
        id=user_id,
        email=normalized_email,
        full_name=full_name,
        role=role,
        status=status,
        is_staff_verified=is_staff_verified,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, message

# Initialize Supabase client
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key)
