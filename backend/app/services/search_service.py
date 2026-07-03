from sqlalchemy import func, literal, or_
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.metadata import Metadata

def hybrid_search(
    db: Session,
    q: str,
    programming_language: str | None = None,
    course_code: str | None = None,
    level: str | None = None,
) -> list[dict]:
    document_text = func.concat(
        func.coalesce(Document.title, ""),
        literal(" "),
        func.coalesce(Document.content_text, ""),
    )
    ts_query = func.plainto_tsquery("english", q)
    search_vector = func.to_tsvector("english", document_text)
    ts_rank = func.ts_rank(search_vector, ts_query)
    trigram_similarity = func.greatest(
        func.similarity(func.coalesce(Document.title, ""), q),
        func.similarity(func.coalesce(Document.content_text, ""), q),
    )
    relevance_score = (ts_rank + (trigram_similarity * 0.4)).label("relevance_score")

    headline_snippet = func.ts_headline(
        "english",
        func.coalesce(Document.content_text, ""),
        ts_query,
        "StartSel=<b>, StopSel=</b>, MaxFragments=2, MaxWords=22, MinWords=6",
    )

    query = (
        db.query(
            Document.id.label("document_id"),
            Document.title.label("title"),
            Metadata.course_code.label("course_code"),
            Metadata.level.label("level"),
            Metadata.language.label("programming_language"),
            Metadata.key_snippet.label("key_snippet"),
            func.coalesce(headline_snippet, Metadata.key_snippet).label("snippet"),
            relevance_score,
        )
        .join(Metadata, Metadata.document_id == Document.id)
        .filter(
            or_(
                search_vector.op("@@")(ts_query),
                trigram_similarity > 0.1,
            )
        )
    )

    if course_code:
        query = query.filter(Metadata.course_code == course_code)
    if programming_language:
        query = query.filter(Metadata.language == programming_language)
    if level:
        query = query.filter(Metadata.level == level)

    rows = query.order_by(relevance_score.desc(), Document.created_at.desc()).limit(50).all()
    results: list[dict] = []
    for row in rows:
        results.append(
            {
                "document_id": row.document_id,
                "title": row.title,
                "relevance_score": float(row.relevance_score or 0),
                "snippet": row.snippet,
                "metadata": {
                    "course_code": row.course_code,
                    "level": row.level,
                    "programming_language": row.programming_language,
                    "key_snippet": row.key_snippet,
                },
            }
        )
    return results
