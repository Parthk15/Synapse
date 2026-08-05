from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NoteCreate(BaseModel):
    content: str
    page_number: Optional[int] = None


class NoteUpdate(BaseModel):
    content: Optional[str] = None
    page_number: Optional[int] = None


class NoteResponse(BaseModel):
    id: str
    paper_id: str
    user_id: str
    page_number: Optional[int] = None
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
