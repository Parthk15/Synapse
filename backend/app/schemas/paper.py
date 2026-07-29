from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class PaperBase(BaseModel):
    title: str
    filename: str


class PaperResponse(PaperBase):
    id: str
    user_id: str
    status: str  # uploaded, processing, ready, failed
    page_count: int
    error_message: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class PaperChunkResponse(BaseModel):
    id: str
    paper_id: str
    chunk_index: int
    page_number: int
    text: str

    class Config:
        from_attributes = True


class PaperDetailResponse(PaperResponse):
    chunks_count: int
