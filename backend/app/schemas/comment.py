from datetime import datetime

from pydantic import BaseModel, Field


class CommentCreateRequest(BaseModel):
    document_id: int
    content: str = Field(min_length=1, max_length=3000)
    parent_comment_id: int | None = None


class CommentResponse(BaseModel):
    id: int
    document_id: int
    user_id: str
    parent_comment_id: int | None = None
    content: str
    created_at: datetime
    author_name: str | None = None
    replies: list["CommentResponse"] = []

    class Config:
        from_attributes = True
