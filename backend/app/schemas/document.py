from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel


class DocumentMetadataResponse(BaseModel):
    course_code: str
    level: str
    language: str | None = None
    key_snippet: str | None = None
    algorithms: Dict[str, List[str]] | None = None
    function_signatures: List[str] | None = None

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    id: int
    title: str
    file_path: str
    uploaded_by: str
    created_at: datetime
    metadata: DocumentMetadataResponse

    class Config:
        from_attributes = True
