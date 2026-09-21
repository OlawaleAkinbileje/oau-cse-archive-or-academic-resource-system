"use client";

import { ReactNode, Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDocumentDetail, getComments, postComment } from "@/lib/api";
import { DocumentDetail as DocumentDetailType } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/components/AuthProvider";
import { useNavbarSlot } from "@/components/NavbarProvider";

function DocumentOutline() {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24">
        <div className="card p-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Document Outline</h3>
          <nav className="space-y-1">
            <ol className="space-y-1">
              <li>
                <a className="outline-item" href="#intro">
                  1. Introduction
                </a>
              </li>
              <li>
                <a className="outline-item" href="#what-is">
                  2. What is Binary Search?
                </a>
              </li>
              <li>
                <a className="outline-item" href="#approaches">
                  3. Approaches to Binary Search
                </a>
                <ol className="mt-1">
                  <li>
                    <a className="outline-item level-2" href="#iterative">
                      3.1 Iterative Approach
                    </a>
                  </li>
                  <li>
                    <a className="outline-item level-2" href="#recursive">
                      3.2 Recursive Approach
                    </a>
                  </li>
                </ol>
              </li>
              <li>
                <a className="outline-item" href="#complexity">
                  4. Complexity Analysis
                </a>
              </li>
              <li>
                <a className="outline-item" href="#applications">
                  5. Applications
                </a>
              </li>
              <li>
                <a className="outline-item" href="#walkthrough">
                  6. Example Walkthrough
                </a>
              </li>
              <li>
                <a className="outline-item" href="#summary">
                  7. Summary
                </a>
              </li>
              <li>
                <a className="outline-item" href="#references">
                  8. References
                </a>
              </li>
            </ol>
          </nav>
        </div>
      </div>
    </aside>
  );
}

function RelatedResourceCard({
  title,
  type,
  timeAgo,
  typeClass,
}: {
  title: string;
  type: string;
  timeAgo: string;
  typeClass: string;
}) {
  return (
    <div className="card card-hover p-4 flex flex-col gap-3 cursor-pointer">
      <div className="flex items-center gap-2">
        <span className={`badge ${typeClass}`}>{type}</span>
        <span className="text-xs text-muted ml-auto">{timeAgo}</span>
      </div>
      <h4 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{title}</h4>
      <div className="flex items-center gap-2 mt-auto pt-2 text-xs text-muted">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>View document</span>
      </div>
    </div>
  );
}

function PDFViewer({ fileUrl, title }: { fileUrl: string; title: string }) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Full Document Preview</h3>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open in new tab
        </a>
      </div>
      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
          className="w-full h-[500px] bg-white opacity-90"
          title={title}
          allowFullScreen
        />
      </div>
    </div>
  );
}

function renderComments(list: any[]): ReactNode {
  return list.map((comment, idx) => {
    const initial = (comment.author_name || "U").charAt(0).toUpperCase();
    return (
      <div key={idx} className="space-y-3">
        <div className="flex gap-3">
          <div className="rounded-full bg-amber-100 text-amber-800 w-9 h-9 flex items-center justify-center font-semibold shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900">{comment.author_name || "Anonymous"}</span>
              <span className="text-xs text-slate-500">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-12 pl-4 border-l-2 border-slate-200 space-y-5">
            {renderComments(comment.replies)}
          </div>
        )}
      </div>
    );
  });
}

function DocumentDetailPageContent() {
  const params = useParams<{ id: string }>();
  const documentId = Number(params.id);
  const router = useRouter();
  const { session } = useAuth();
  const [doc, setDoc] = useState<DocumentDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [docSearchInput, setDocSearchInput] = useState("");

  useNavbarSlot(
    "center",
    (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = docSearchInput.trim();
          if (q) router.push(`/results?q=${encodeURIComponent(q)}`);
        }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="input-surface relative flex items-center overflow-hidden px-4 py-2.5 rounded-xl border border-slate-200 focus-within:border-[#d4a017] focus-within:ring-2 focus-within:ring-[#d4a017]/20 transition-all bg-slate-50">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400">
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
            />
          </svg>
          <input
            value={docSearchInput}
            onChange={(e) => setDocSearchInput(e.target.value)}
            placeholder="Search algorithms, course materials, lecture notes..."
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 px-3"
          />
        </div>
      </form>
    ),
    [docSearchInput],
  );

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (Number.isNaN(documentId)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const documentData = await getDocumentDetail(documentId);
        if (!cancelled) {
          setDoc(documentData);
          getComments(documentId)
            .then(list => {
              if (!cancelled) setComments(list || []);
            })
            .catch(() => {});
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load document.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const handlePostComment = async () => {
    if (!commentText.trim() || !session.accessToken) return;
    setPostingComment(true);
    try {
      const newC = await postComment(documentId, commentText.trim(), null);
      setComments(prev => [newC, ...prev]);
      setCommentText("");
    } catch (e) {
      alert("Failed to post comment.");
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex min-h-[60vh] items-center justify-center pt-8">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-sm text-slate-600">Loading document...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !doc) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-xl font-semibold text-slate-900">Document not found</p>
          <p className="mt-2 text-sm text-muted">{error || "The requested document could not be loaded."}</p>
          <Link href="/results?q=" className="btn-primary mt-6 inline-flex">
            Back to Search
          </Link>
        </div>
      </main>
    );
  }

  const fileUrl = doc.file_url;

  const truncatedTitle = doc.title.length > 50 ? doc.title.substring(0, 50) + "..." : doc.title;

  let badgeLabel: string;
  let badgeClass: string;
  if (doc.metadata?.programming_language) {
    badgeLabel = doc.metadata.programming_language.toUpperCase();
    badgeClass = "badge-py";
  } else if (doc.metadata?.course_code) {
    badgeLabel = doc.metadata.course_code;
    badgeClass = "badge-default";
  } else {
    badgeLabel = "Document";
    badgeClass = "badge-default";
  }

  const courseInfo = doc.metadata?.course_code
    ? `${doc.metadata.course_code}${doc.metadata?.level ? ` - Level ${doc.metadata.level}` : ""}`
    : "Resource Document";
  const uploadedDate = new Date(doc.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const titleLower = (doc.title || "").toLowerCase();
  const fileUrlLower = (doc.file_url || "").toLowerCase();
  let fileBadgeLabel: string;
  let fileBadgeClass: string;
  if (titleLower.endsWith('.py') || fileUrlLower.endsWith('.py') || doc.metadata?.programming_language) {
    fileBadgeLabel = "CODE";
    fileBadgeClass = "badge-py";
  } else if (titleLower.endsWith('.pdf') || fileUrlLower.endsWith('.pdf')) {
    fileBadgeLabel = "PDF";
    fileBadgeClass = "badge-pdf";
  } else if (titleLower.endsWith('.ppt') || titleLower.endsWith('.pptx') || fileUrlLower.endsWith('.ppt') || fileUrlLower.endsWith('.pptx')) {
    fileBadgeLabel = "PPTX";
    fileBadgeClass = "badge-ppt";
  } else {
    fileBadgeLabel = "FILE";
    fileBadgeClass = "badge-default";
  }

  const abstractContent = doc.metadata?.key_snippet
    ? doc.metadata.key_snippet
    : doc.content_text
    ? doc.content_text.substring(0, 400) + (doc.content_text.length > 400 ? "..." : "")
    : "No abstract available.";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-700 transition-colors">
            Home
          </Link>
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/results?q=" className="hover:text-slate-700 transition-colors">
            Search Results
          </Link>
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 font-medium truncate">{truncatedTitle}</span>
        </nav>

        <div className="flex gap-8">
          <DocumentOutline />

          <div className="flex-1 min-w-0 space-y-6">
            <section className="card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-5">
                {doc.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mb-4">
                <span className="font-medium text-slate-900">{courseInfo}</span>
                <span className="w-1 h-1 rounded-full bg-slate-400" />
                <span>{uploadedDate}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
                <span className="inline-flex items-center gap-1.5">
                  <span className={`badge ${fileBadgeClass}`}>{fileBadgeLabel}</span>
                </span>
                {doc.metadata?.programming_language && (
                  <>
                    <span className="text-slate-400">|</span>
                    <span>Code: {doc.metadata.programming_language}</span>
                  </>
                )}
                <span className="text-slate-400">|</span>
                <span>Uploaded {uploadedDate}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn-primary">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Document
                </button>
                <a
                  href={fileUrl}
                  download
                  className="btn-outline"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
                <button type="button" className="btn-outline">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Cite
                </button>
                <button
                  type="button"
                  onClick={() => setBookmarked(!bookmarked)}
                  className={`btn-outline !px-3 ${bookmarked ? "bg-yellow-50 border-yellow-300" : ""}`}
                  aria-label="Bookmark"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-5 w-5 stroke-current ${bookmarked ? "fill-yellow-500 stroke-yellow-500" : "fill-none"}`}
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </section>

            <section className="card p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Abstract</h2>
              <p className="text-slate-600 leading-7 text-sm md:text-base">
                {abstractContent}
              </p>
            </section>

            <section className="card p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">Related Resources</h2>
                <Link
                  href="/results?q=binary%20search"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  View all
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RelatedResourceCard
                  title="Implementation of Binary Search in Python"
                  type="Python"
                  timeAgo="12 min ago"
                  typeClass="badge-py"
                />
                <RelatedResourceCard
                  title="Sorting and Searching Performance Labs"
                  type="Manual"
                  timeAgo="2 days ago"
                  typeClass="badge-default"
                />
                <RelatedResourceCard
                  title="Tree Traversals and Binary Search Trees"
                  type="Slides"
                  timeAgo="1 week ago"
                  typeClass="badge-ppt"
                />
              </div>
            </section>

            <section className="card p-6 md:p-8">
              <PDFViewer fileUrl={fileUrl} title={doc.title} />
            </section>

            <section className="card p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Comments {comments.length ? `(${comments.length})` : ""}</h2>

              {session.accessToken ? (
                <div className="mb-6">
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                    className="w-full input-surface rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={postingComment || !commentText.trim()}
                      onClick={handlePostComment}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {postingComment ? "Posting..." : "Post Comment"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 flex items-center justify-between flex-wrap gap-3">
                  <span>You must be logged in to post a comment.</span>
                  <Link href="/auth/login" className="btn-outline text-xs">Log in to comment</Link>
                </div>
              )}

              <div className="space-y-5">
                {loadingComments && <div className="text-sm text-slate-500">Loading comments...</div>}
                {!loadingComments && comments.length === 0 && <div className="text-sm text-slate-500">No comments yet. Be the first to comment!</div>}
                {renderComments(comments)}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DocumentDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white">
          <div className="flex min-h-screen items-center justify-center">
            <LoadingSpinner />
          </div>
        </main>
      }
    >
      <DocumentDetailPageContent />
    </Suspense>
  );
}
