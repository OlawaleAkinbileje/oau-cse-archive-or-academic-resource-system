from sqlalchemy import Boolean, Column, DateTime, String, Text, func

from app.core.database import Base


class User(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, nullable=False, default="student")
    status = Column(String, nullable=False, default="active")
    is_staff_verified = Column(Boolean, nullable=False, default=False)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
