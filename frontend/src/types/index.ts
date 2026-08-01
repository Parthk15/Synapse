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
