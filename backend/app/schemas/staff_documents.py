from pydantic import BaseModel


class StaffDocumentItem(BaseModel):
    id: str
    file_url: str
    created_at: str
    title: str | None = None
    course_code: str | None = None
    level: int | None = None
    programming_language: str | None = None


class StaffDocumentUpdateRequest(BaseModel):
    title: str | None = None
    course_code: str | None = None
    level: int | None = None
