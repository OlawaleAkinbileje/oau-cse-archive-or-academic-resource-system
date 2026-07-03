from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Metadata(Base):
    __tablename__ = "document_metadata"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    course_code = Column(String, nullable=False, index=True)
    level = Column(String, nullable=False, index=True)
    language = Column(String, nullable=True, index=True)
    key_snippet = Column(Text, nullable=True)

    document = relationship("Document", back_populates="metadata_items")
