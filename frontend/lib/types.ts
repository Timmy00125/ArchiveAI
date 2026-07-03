export interface EvidenceSource {
  id?: string;
  rank?: number;
  filename?: string;
  source?: string;
  page?: number | string | null;
  score?: number;
  excerpt?: string;
  metadata?: Record<string, unknown>;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    sources?: EvidenceSource[];
    [key: string]: unknown;
  };
}

export interface ChatSession {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionSummary {
  session_id: string;
  last_message: string;
  timestamp: string;
}

export interface Document {
  id: string;
  filename: string;
  size?: number;
  uploaded_at: string;
  status: "processing" | "ready" | "error";
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  filename: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}
