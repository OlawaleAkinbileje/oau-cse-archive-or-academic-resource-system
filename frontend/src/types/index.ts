export type FileType = "pdf" | "code" | "txt" | "video" | "image";

export interface SearchFilters {
  level?: string;
  courseCode?: string;
  fileType?: FileType | "";
}

export interface SearchResult {
  document_id: number;
  title: string;
  relevance_score: number;
  snippet: string | null;
  metadata: {
    course_code: string | null;
    level: string | null;
    programming_language: string | null;
    key_snippet: string | null;
  };
  file_url?: string;
}

export interface CommentItem {
  id: number;
  document_id: number;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string | null;
  parent_comment_id?: number | null;
  replies?: CommentItem[];
}

export interface StaffDocument {
  id: string;
  file_url: string;
  created_at: string;
  title: string | null;
  course_code: string | null;
  level: number | null;
  programming_language: string | null;
}

export interface DocumentDetail {
  id: number;
  title: string;
  file_url: string;
  content_text: string | null;
  created_at: string;
  metadata: {
    course_code: string | null;
    level: string | null;
    programming_language: string | null;
    key_snippet: string | null;
  };
}
