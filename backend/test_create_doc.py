from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.models.document import Document
from app.models.metadata import Metadata
from app.core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    # Create a simple test document
    test_doc = Document(
        title="Test Document.pdf",
        file_path="https://example.com/test.pdf",
        content_text="This is a test document for CPE502. It contains sample content about algorithms.",
        uploaded_by="test-user-id"
    )
    db.add(test_doc)
    db.flush()
    
    test_meta = Metadata(
        document_id=test_doc.id,
        course_code="CPE502",
        level="500",
        language=None,
        key_snippet="This is a test key snippet for the document about algorithms."
    )
    db.add(test_meta)
    
    db.commit()
    print(f"Test document created with ID: {test_doc.id}")
    print(f"Metadata created with document_id: {test_meta.document_id}")
    
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
