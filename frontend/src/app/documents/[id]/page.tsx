"use client";

import { ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { BackButton } from "@/components/BackButton";
import { CodePreview } from "@/components/CodePreview";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { WorkspaceRail } from "@/components/WorkspaceRail";
import { getComments, postComment, getDocumentDetail } from "@/lib/api";
import { CommentItem, DocumentDetail as DocumentDetailType } from "@/types";

function formatCommentTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function CommentItemComponent({
  item,
  documentId,
  onCommentPosted,
  level = 0,
}: {
  item: CommentItem;
  documentId: number;
  onCommentPosted: (comment: CommentItem) => void;
  level?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const author = item.author_name || "Archive User";
  const indent = level > 0 ? "ml-8 border-l border-slate-200 pl-4" : "";

  const handleSubmitReply = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const newComment = await postComment(documentId, replyContent.trim(), item.id);
      onCommentPosted({
        ...newComment,
        author_name: newComment.author_name ?? "You",
      });
      setShowReply(false);
      setReplyContent("");
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article key={item.id} className={`glass-card-soft p-4 ${indent}`}>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white shadow-md">
          {author.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-semibold text-slate-900">{author}</p>
            <span className="text-xs text-slate-500">{formatCommentTime(item.created_at)}</span>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-600">{item.content}</p>
          <button
            type="button"
            onClick={() => setShowReply(!showReply)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reply
          </button>
          {showReply && (
            <form onSubmit={handleSubmitReply} className="mt-3 space-y-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="input-surface w-full min-h-24 px-4 py-3 outline-none text-slate-900"
              />
              <button
                type="submit"
                disabled={submitting}
                className="primary-button text-sm"
              >
                {submitting ? "Posting..." : "Post Reply"}
              </button>
            </form>
          )}
          {item.replies && item.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {item.replies.map((reply) => (
                <CommentItemComponent
                  key={reply.id}
                  item={reply}
                  documentId={documentId}
                  onCommentPosted={onCommentPosted}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function DocumentViewer({ doc }: { doc: DocumentDetailType }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(doc.content_text || doc.metadata.key_snippet || "");

  const titleLower = doc.title.toLowerCase();
  const isPDF = titleLower.endsWith(".pdf") || doc.metadata.programming_language === "pdf";
  const isVideo = ["mp4", "webm", "avi", "mov", "mkv", "flv", "wmv"].some((ext) => titleLower.endsWith(`.${ext}`));
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].some((ext) => titleLower.endsWith(`.${ext}`));
  const isOffice = ["docx", "doc", "xlsx", "xls", "pptx", "ppt", "odt", "ods", "odp"].some((ext) => titleLower.endsWith(`.${ext}`));
  const isText = ["txt", "md", "json", "xml", "html", "css", "js", "ts", "py", "java", "c", "cpp", "h", "cs", "php", "rb", "go", "rs", "kt", "swift"].some((ext) => titleLower.endsWith(`.${ext}`));

  const codeBlock = doc.content_text || doc.metadata.key_snippet || "";

  const getViewerUrl = () => {
    if (isOffice) {
      return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(doc.file_url)}`;
    }
    return null;
  };

  const officeViewerUrl = getViewerUrl();

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">File Viewer</h3>
        <div className="flex items-center gap-3">
          {(isText || (!isPDF && !isVideo && !isImage && !isOffice)) && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-medium transition-colors"
            >
              {isEditing ? "Stop Editing" : "Edit"}
            </button>
          )}
          <a
            href={doc.file_url}
            download
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      </div>

      {isPDF && (
        <div className="w-full rounded-xl border border-slate-200 shadow-lg overflow-hidden">
          <iframe
            src={`${doc.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-[800px]"
            title={doc.title}
            allowFullScreen
          />
        </div>
      )}

      {isVideo && (
        <div className="w-full rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-black">
          <video
            controls
            className="w-full max-h-[600px]"
            poster=""
            playsInline
            preload="metadata"
          >
            <source src={doc.file_url} />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {isImage && (
        <div className="w-full rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-slate-100 flex justify-center items-center">
          <img
            src={doc.file_url}
            alt={doc.title}
            className="max-w-full max-h-[800px] object-contain"
            loading="lazy"
          />
        </div>
      )}

      {isOffice && officeViewerUrl && (
        <div className="w-full rounded-xl border border-slate-200 shadow-lg overflow-hidden">
          <iframe
            src={officeViewerUrl}
            className="w-full h-[800px]"
            title={doc.title}
            allowFullScreen
          />
        </div>
      )}

      {(isText || (!isPDF && !isVideo && !isImage && !isOffice)) && (
        <CodePreview
          language={doc.metadata.programming_language || "text"}
          code={isEditing ? editedCode : codeBlock}
          editable={isEditing}
          onChange={setEditedCode}
        />
      )}

      {!isPDF && !isVideo && !isImage && !isOffice && !isText && !doc.content_text && !doc.metadata.key_snippet && (
        <div className="glass-card-soft p-8 text-center">
          <p className="text-slate-600 text-lg">No preview available for this file type</p>
          <p className="text-slate-500 text-sm mt-2">Please download the file to view it</p>
        </div>
      )}
    </div>
  );
}

function DocumentDetailPageContent() {
  const params = useParams<{ id: string }>();
  const documentId = Number(params.id);
  const [doc, setDoc] = useState<DocumentDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [discussion, setDiscussion] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (Number.isNaN(documentId)) {
        setLoading(false);
        setLoadingComments(false);
        return;
      }

      setLoading(true);
      try {
        const [documentData, comments] = await Promise.all([
          getDocumentDetail(documentId),
          getComments(documentId),
        ]);
        if (!cancelled) {
          setDoc(documentData);
          setDiscussion(comments);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load data.";
          setFeedback(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingComments(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const handleCommentPosted = (newComment: CommentItem) => {
    if (newComment.parent_comment_id) {
      const addReply = (comments: CommentItem[]): CommentItem[] => {
        return comments.map((c) => {
          if (c.id === newComment.parent_comment_id) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            };
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: addReply(c.replies),
            };
          }
          return c;
        });
      };
      setDiscussion(addReply(discussion));
    } else {
      setDiscussion([newComment, ...discussion]);
    }
    setFeedback("Comment posted successfully.");
  };

  const handleCommentSubmit = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const createdComment = await postComment(documentId, comment.trim());
      handleCommentPosted({
        ...createdComment,
        author_name: createdComment.author_name ?? "You",
      });
      setComment("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not post comment.";
      setFeedback(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=education%20illustration%20books%20and%20gears%20in%20blue%20and%20orange%20colors&image_size=square"
            alt=""
            className="absolute -right-10 top-10 w-96 opacity-40"
          />
          <img
            src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=abstract%20educational%20shapes%20pencils%20books%20blue%20theme&image_size=square"
            alt=""
            className="absolute -left-20 bottom-20 w-72 opacity-30"
          />
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
          <section className="glass-panel p-10 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-sm text-slate-600">Loading resource...</p>
          </section>
        </div>
      </main>
    );
  }

  if (!doc) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=education%20illustration%20books%20and%20gears%20in%20blue%20and%20orange%20colors&image_size=square"
            alt=""
            className="absolute -right-10 top-10 w-96 opacity-40"
          />
          <img
            src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=abstract%20educational%20shapes%20pencils%20books%20blue%20theme&image_size=square"
            alt=""
            className="absolute -left-20 bottom-20 w-72 opacity-30"
          />
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
          <section className="glass-panel p-10 text-center">
            <p className="text-xl text-slate-900">Document not found</p>
          </section>
        </div>
      </main>
    );
  }

  const tagItems = [
    doc.metadata.course_code,
    doc.metadata.level ? `${doc.metadata.level} level` : null,
    doc.metadata.programming_language,
  ].filter(Boolean) as string[];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=education%20illustration%20books%20and%20gears%20in%20blue%20and%20orange%20colors&image_size=square"
          alt=""
          className="absolute -right-10 top-10 w-96 opacity-40"
        />
        <img
          src="https://coresg-normal.trae.ai/api/v1/text-to-image?prompt=abstract%20educational%20shapes%20pencils%20books%20blue%20theme&image_size=square"
          alt=""
          className="absolute -left-20 bottom-20 w-72 opacity-30"
        />
      </div>

      <div className="relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:hidden">
              <WorkspaceRail />
            </div>

            <div className="flex-1 space-y-6 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <BackButton fallbackHref="/results?q=" label="Back to Results" />
                <div className="flex flex-wrap gap-3">
                  {tagItems.map((item) => (
                    <span key={item} className="status-pill">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <section className="glass-panel p-6 md:p-8">
                <p className="section-label">Resource Detail</p>
                <div className="mt-4 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                  <div>
                    <h1 className="text-3xl font-semibold text-slate-900 md:text-5xl">{doc.title}</h1>
                    <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
                      {doc.metadata.key_snippet}
                    </p>
                  </div>
                  <aside className="glass-card p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-700">Overview</p>
                    <div className="mt-5 space-y-4 text-sm">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                        <span className="text-muted">Course</span>
                        <span className="font-medium text-slate-900">{doc.metadata.course_code || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                        <span className="text-muted">Level</span>
                        <span className="font-medium text-slate-900">{doc.metadata.level || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 pb-1">
                        <span className="text-muted">Language</span>
                        <span className="font-medium text-slate-900">{doc.metadata.programming_language || "Resource"}</span>
                      </div>
                    </div>
                    <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
                      Review the content carefully, then use the discussion box to add clarifications, fixes, or study notes.
                    </div>
                  </aside>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="glass-panel p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="section-label">Content Viewer</p>
                      <h2 className="mt-3 text-2xl font-semibold text-slate-900">Preview the resource</h2>
                    </div>
                  </div>
                  <DocumentViewer doc={doc} />
                </div>

                <aside className="glass-panel p-6">
                  <p className="section-label">Focus Areas</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">Reading checklist</h2>
                  <div className="mt-6 space-y-4">
                    <div className="glass-card-soft p-4">
                      <p className="font-semibold text-slate-900">Confirm the algorithm or concept</p>
                      <p className="mt-2 text-sm text-muted">Check the metadata and preview to ensure this matches your intended topic.</p>
                    </div>
                    <div className="glass-card-soft p-4">
                      <p className="font-semibold text-slate-900">Inspect the content</p>
                      <p className="mt-2 text-sm text-muted">Review carefully and note any key points or findings.</p>
                    </div>
                    <div className="glass-card-soft p-4">
                      <p className="font-semibold text-slate-900">Leave context for others</p>
                      <p className="mt-2 text-sm text-muted">Post corrections, references, or links to related course material.</p>
                    </div>
                  </div>
                </aside>
              </section>

              <section className="glass-panel p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="section-label">Knowledge Hub</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">Discussion and notes</h2>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
                  <div className="space-y-4">
                    {loadingComments && (
                      <div className="glass-card-soft p-8 text-center">
                        <LoadingSpinner />
                        <p className="mt-2 text-sm text-slate-600">Loading comment history...</p>
                      </div>
                    )}
                    {!loadingComments && discussion.length === 0 && (
                      <article className="glass-card-soft p-5">
                        <p className="font-semibold text-slate-900">No comments yet</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          Be the first to add context, corrections, or related study notes for this resource.
                        </p>
                      </article>
                    )}
                    {!loadingComments &&
                      discussion.map((item) => (
                        <CommentItemComponent
                          key={item.id}
                          item={item}
                          documentId={documentId}
                          onCommentPosted={handleCommentPosted}
                        />
                      ))}
                  </div>

                  <div className="glass-card p-5">
                    <h3 className="text-lg font-semibold text-slate-900">Post a note</h3>
                    <form onSubmit={handleCommentSubmit} className="mt-4 space-y-4">
                      <textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        className="input-surface min-h-36 w-full px-4 py-3 outline-none text-slate-900"
                        placeholder="Share context, corrections, or additional references..."
                      />
                      <button disabled={submitting} type="submit" className="primary-button w-full text-sm">
                        {submitting ? "Posting..." : "Post Comment"}
                      </button>
                    </form>
                    {feedback && <p className="mt-4 text-sm text-slate-600">{feedback}</p>}
                  </div>
                </div>
              </section>
            </div>

            <div className="hidden lg:block">
              <WorkspaceRail />
            </div>
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
        <main className="min-h-screen pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="app-shell">
            <section className="glass-panel p-10 text-center">
              <LoadingSpinner />
              <p className="mt-2 text-sm text-slate-600">Loading resource detail...</p>
            </section>
          </div>
        </main>
      }
    >
      <DocumentDetailPageContent />
    </Suspense>
  );
}
