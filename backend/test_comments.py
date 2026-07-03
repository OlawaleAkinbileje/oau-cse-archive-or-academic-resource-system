from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, joinedload
from app.models.comment import Comment
from app.core.config import settings
from app.services.comment_service import list_comments_for_document, _build_nested_comments

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    print("Calling list_comments_for_document for doc 2:")
    comments = list_comments_for_document(db, 2)
    print(f"Got comments: {comments}")
    nested = _build_nested_comments(comments)
    print(f"Nested: {nested}")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    print(traceback.format_exc())
finally:
    db.close()
