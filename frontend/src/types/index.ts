export type PaperStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Paper {
  id: string;
  user_id: string;
  title: string;
  filename: string;
  status: PaperStatus;
  page_count: number;
  error_message?: string | null;
  uploaded_at: string;
  updated_at?: string | null;
}

export interface PaperDetail extends Paper {
  chunks_count: number;
}

export interface SearchResultChunk {
  chunk_id: string;
  paper_id: string;
  paper_title: string;
  chunk_index: number;
  page_number: number;
  text: string;
  score: number;
}

export interface PaperSearchResponse {
  query: string;
  results: SearchResultChunk[];
}

export interface CitationSource {
  paper_id: string;
  paper_title: string;
  page_number: number;
  chunk_index: number;
  text_snippet: string;
  relevance_score: number;
}

export interface PaperChatResponse {
  answer: string;
  citations: CitationSource[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationSource[];
  timestamp: string;
}

export interface PaperSummary {
  paper_id: string;
  title: string;
  executive_summary: string;
  methodology?: string;
  key_findings: string[];
  takeaways: string[];
  total_pages: number;
  total_chunks: number;
}

export interface PaperNote {
  id: string;
  paper_id: string;
  user_id: string;
  page_number?: number | null;
  content: string;
  created_at: string;
  updated_at?: string | null;
}

