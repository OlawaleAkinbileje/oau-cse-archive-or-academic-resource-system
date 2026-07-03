from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    role: str
    status: str
    is_staff_verified: bool

    class Config:
        from_attributes = True
