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
    updated_at: Optional[datetime] = None

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


class PaperSearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    paper_id: Optional[str] = None


class SearchResultChunk(BaseModel):
    chunk_id: str
    paper_id: str
    paper_title: str
    chunk_index: int
    page_number: int
    text: str
    score: float


class PaperSearchResponse(BaseModel):
    query: str
    results: List[SearchResultChunk]


class PaperChatRequest(BaseModel):
    message: str
    paper_id: Optional[str] = None
    chat_history: Optional[List[dict]] = None


class CitationSource(BaseModel):
    paper_id: str
    paper_title: str
    page_number: int
    chunk_index: int
    text_snippet: str
    relevance_score: float


class PaperChatResponse(BaseModel):
    answer: str
    citations: List[CitationSource]


class PaperSummaryResponse(BaseModel):
    paper_id: str
    title: str
    executive_summary: str
    methodology: Optional[str] = None
    key_findings: List[str]
    takeaways: List[str]
    total_pages: int
    total_chunks: int

