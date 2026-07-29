import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.database import Base


class Paper(Base):
    __tablename__ = "papers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    status = Column(String(50), nullable=False, default="processing")  # uploaded, processing, ready, failed
    page_count = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="papers")
    chunks = relationship("PaperChunk", back_populates="paper", cascade="all, delete-orphan", order_by="PaperChunk.chunk_index")


class PaperChunk(Base):
    __tablename__ = "paper_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True)

    paper = relationship("Paper", back_populates="chunks")
