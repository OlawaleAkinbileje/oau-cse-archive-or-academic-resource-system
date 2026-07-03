from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.database_url)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER REFERENCES comments(id)"))
        conn.commit()
        print("Successfully added parent_comment_id column to comments table!")
    except Exception as e:
        print(f"Error: {e}")
