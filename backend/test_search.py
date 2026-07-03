from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.services.fts_search_service import search_with_fts_index

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

try:
    results = search_with_fts_index(db, q="CPE502")
    print("Search results:", results)
except Exception as e:
    import traceback
    print(f"Error searching: {e}")
    print(traceback.format_exc())
finally:
    db.close()
