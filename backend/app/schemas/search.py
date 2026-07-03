from pydantic import BaseModel


class SearchQueryParams(BaseModel):
    q: str
    language: str | None = None
    course: str | None = None
    level: int | None = None


class SearchMetadata(BaseModel):
    course_code: str | None = None
    level: str | None = None
    programming_language: str | None = None
    key_snippet: str | None = None


class SearchResultItem(BaseModel):
    document_id: int
    title: str
    relevance_score: float
    snippet: str | None = None
    metadata: SearchMetadata
