from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, joinedload
from app.models.document import Document
from app.core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    docs = db.query(Document).options(joinedload(Document.metadata_items)).all()
    print("Found", len(docs), "documents:")
    for doc in docs:
        print(f"\nDoc ID: {doc.id}, Title: {doc.title}")
        print(f"  Content Text (preview): {doc.content_text[:100] if doc.content_text else 'None'}")
        print(f"  Metadata items count: {len(doc.metadata_items)}")
        for meta in doc.metadata_items:
            print(f"    Meta: course={meta.course_code}, level={meta.level}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
