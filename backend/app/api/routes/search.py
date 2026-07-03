import logging
from time import perf_counter

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.search import SearchResultItem
from app.services.fts_search_service import search_with_fts_index

router = APIRouter(tags=["search"])
logger = logging.getLogger(__name__)


@router.get("/search", response_model=list[SearchResultItem])
def search_documents(
    q: str = Query(..., min_length=1),
    programming_language: str | None = Query(default=None),
    language: str | None = Query(default=None),
    course_code: str | None = Query(default=None),
    course: str | None = Query(default=None),
    level: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    start_time = perf_counter()
    selected_language = programming_language or language
    selected_course = course_code or course
    results = search_with_fts_index(
        db=db,
        q=q,
        course_code=selected_course,
        programming_language=selected_language,
    )
    duration_ms = (perf_counter() - start_time) * 1000
    logger.info(
        "search_completed query=%r course_code=%r programming_language=%r level=%r results=%d duration_ms=%.2f",
        q,
        selected_course,
        selected_language,
        level,
        len(results),
        duration_ms,
    )
    return [SearchResultItem(**item) for item in results]
