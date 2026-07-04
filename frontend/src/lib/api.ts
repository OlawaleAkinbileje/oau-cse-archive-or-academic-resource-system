import {
  CommentItem,
  SearchFilters,
  SearchResult,
  StaffDocument,
  DocumentDetail,
} from "@/types";
import { AUTH_TOKEN_KEY } from "@/lib/auth-session";
import { searchCache } from "./search-cache";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  console.log(
    "getAuthHeader - token found:",
    !!token,
    "token length:",
    token?.length,
  );
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function generateCacheKey(query: string, filters: SearchFilters): string {
  const parts = [query];
  if (filters.level) parts.push(`level:${filters.level}`);
  if (filters.courseCode) parts.push(`course:${filters.courseCode}`);
  if (filters.fileType) parts.push(`type:${filters.fileType}`);
  return parts.join("|").toLowerCase().trim();
}

export async function searchDocuments(
  query: string,
  filters: SearchFilters,
): Promise<SearchResult[]> {
  const cacheKey = generateCacheKey(query, filters);
  const cached = typeof window !== "undefined" ? searchCache.get(cacheKey) : null;

  if (cached) {
    console.log("Search result loaded from cache:", cacheKey);
    return cached as SearchResult[];
  }

  const params = new URLSearchParams({ q: query });
  if (filters.level) params.set("level", filters.level);
  if (filters.courseCode) params.set("course_code", filters.courseCode);
  if (filters.fileType === "code") params.set("programming_language", "python");
  if (filters.fileType === "pdf") params.set("programming_language", "pdf");

  const response = await fetch(`${API_BASE}/search?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Search request failed");
  }

  const data = await response.json();

  if (typeof window !== "undefined") {
    searchCache.set(cacheKey, data);
    console.log("Search result cached:", cacheKey);
  }

  return data;
}

export async function postComment(
  documentId: number,
  content: string,
  parentCommentId?: number | null,
) {
  const response = await fetch(`${API_BASE}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      document_id: documentId,
      content,
      parent_comment_id: parentCommentId,
    }),
  });

  if (!response.ok) {
    throw new Error("Comment submission failed");
  }
  return response.json();
}

export async function getComments(documentId: number): Promise<CommentItem[]> {
  const response = await fetch(`${API_BASE}/comments/${documentId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load comments.");
  }
  return response.json();
}

export async function getDocumentDetail(
  documentId: number,
): Promise<DocumentDetail> {
  const response = await fetch(`${API_BASE}/documents/${documentId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load document.");
  }
  return response.json();
}

export async function uploadDocument(formData: FormData) {
  console.log("uploadDocument - calling fetch to:", `${API_BASE}/upload`);
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
    },
    body: formData,
  });
  console.log(
    "uploadDocument - response status:",
    response.status,
    "response ok:",
    response.ok,
  );
  if (!response.ok) {
    const responseText = await response.text();
    console.error("uploadDocument - error response body:", responseText);
    throw new Error(
      `Upload failed. Make sure your account is verified staff. Error: ${responseText}`,
    );
  }
  const json = await response.json();
  console.log("uploadDocument - json response:", json);
  return json;
}

export async function getMyStaffDocuments(): Promise<StaffDocument[]> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
  };
  console.log(
    "getMyStaffDocuments - calling fetch to:",
    `${API_BASE}/documents/mine`,
    "with headers:",
    headers,
  );
  const response = await fetch(`${API_BASE}/documents/mine`, {
    headers,
    cache: "no-store",
  });
  console.log(
    "getMyStaffDocuments - response status:",
    response.status,
    "response ok:",
    response.ok,
  );
  if (!response.ok) {
    const responseText = await response.text();
    console.error("getMyStaffDocuments - error response body:", responseText);
    throw new Error("Failed to fetch your uploaded documents.");
  }
  const json = await response.json();
  console.log("getMyStaffDocuments - json response:", json);
  return json;
}

export async function updateStaffDocument(
  documentId: string,
  payload: { title?: string; course_code?: string; level?: number },
): Promise<StaffDocument> {
  const response = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to update resource metadata.");
  }
  return response.json();
}

export async function deleteStaffDocument(documentId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to delete resource.");
  }
}

export async function getDashboardStats() {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
  };
  const response = await fetch(`${API_BASE}/documents/dashboard/stats`, {
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats.");
  }
  return response.json();
}
