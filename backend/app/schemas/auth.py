from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserResponse


class LoginValidationRequest(BaseModel):
    access_token: str


class LoginValidationResponse(BaseModel):
    user: UserResponse
    is_valid: bool = True


class SignupRequest(BaseModel):
    user_id: str = Field(min_length=3)
    email: EmailStr
    full_name: str | None = None
    requested_role: str | None = None


class SignupResponse(BaseModel):
    user: UserResponse
    message: str
