from sqlalchemy import text
from sqlalchemy.orm import Session


def search_with_fts_index(
    db: Session,
    *,
    q: str,
    course_code: str | None = None,
    programming_language: str | None = None,
) -> list[dict]:
    sql = text(
        """
        SELECT
            d.id AS document_id,
            d.file_path AS file_url,
            d.title,
            m.course_code,
            m.level,
            m.language AS programming_language,
            m.key_snippet,
            ts_rank(
                to_tsvector('english', coalesce(d.title, '') || ' ' || coalesce(m.key_snippet, '') || ' ' || coalesce(d.content_text, '')),
                plainto_tsquery('english', :q)
            ) AS relevance_score,
            ts_headline(
                'english',
                coalesce(m.key_snippet, '') || ' ' || coalesce(d.content_text, ''),
                plainto_tsquery('english', :q),
                'StartSel=<b>, StopSel=</b>, MaxFragments=2, MaxWords=20, MinWords=5'
            ) AS snippet
        FROM public.document_metadata m
        JOIN public.documents d ON d.id = m.document_id
        WHERE to_tsvector('english', coalesce(d.title, '') || ' ' || coalesce(m.key_snippet, '') || ' ' || coalesce(d.content_text, ''))
              @@ plainto_tsquery('english', :q)
          AND (:course_code IS NULL OR m.course_code = :course_code)
          AND (:programming_language IS NULL OR m.language = :programming_language)
        ORDER BY relevance_score DESC, d.created_at DESC
        LIMIT 50
        """
    )
    rows = db.execute(
        sql,
        {
            "q": q,
            "course_code": course_code,
            "programming_language": programming_language,
        },
    ).mappings()

    return [
        {
            "document_id": row["document_id"],
            "title": row["title"],
            "relevance_score": float(row["relevance_score"] or 0),
            "snippet": row["snippet"] or row["key_snippet"],
            "metadata": {
                "course_code": row["course_code"],
                "level": row["level"],
                "programming_language": row["programming_language"],
                "key_snippet": row["key_snippet"],
            },
            "file_url": row["file_url"],
        }
        for row in rows
    ]
