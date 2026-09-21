import Link from "next/link";

import { SearchResult } from "@/types";

function highlightQuery(text: string, query: string) {
  if (!query) return text;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "ig");
  return text.split(regex).map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded-md bg-blue-300/20 px-1.5 py-0.5 text-blue-700">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

type ResourceKind = "pdf" | "code" | "ppt" | "doc";

function detectResourceKind(result: SearchResult): ResourceKind {
  const lang = result.metadata?.programming_language?.toLowerCase() ?? "";
  if (lang === "python" || lang === "py" || result.metadata?.programming_language) {
    return "code";
  }
  const title = result.title.toLowerCase();
  if (
    title.includes("slide") ||
    title.includes("ppt") ||
    title.includes("powerpoint") ||
    title.includes("past") ||
    title.includes("question") ||
    title.includes("exam") ||
    title.includes("test") ||
    title.includes("quiz")
  ) {
    return "ppt";
  }
  if (
    title.includes(".doc") ||
    title.includes("docx") ||
    title.includes("word") ||
    title.includes("note") ||
    title.includes("notes")
  ) {
    return "doc";
  }
  return "pdf";
}

function getResourceIconClasses(kind: ResourceKind): string {
  switch (kind) {
    case "pdf":
      return "resource-icon resource-icon-pdf";
    case "code":
      return "resource-icon resource-icon-code";
    case "ppt":
      return "resource-icon resource-icon-ppt";
    case "doc":
      return "resource-icon resource-icon-doc";
  }
}

function getBadgeClasses(kind: ResourceKind): string {
  switch (kind) {
    case "pdf":
      return "badge badge-pdf";
    case "code":
      return "badge badge-py";
    case "ppt":
      return "badge badge-ppt";
    case "doc":
      return "badge badge-default";
  }
}

function getBadgeLabel(kind: ResourceKind): string {
  switch (kind) {
    case "pdf":
      return "PDF";
    case "code":
      return "PY";
    case "ppt":
      return "PPT";
    case "doc":
      return "DOC";
  }
}

function getResourceTypeLabel(kind: ResourceKind): string {
  switch (kind) {
    case "pdf":
      return "Document";
    case "code":
      return "Code";
    case "ppt":
      return "Slides";
    case "doc":
      return "Notes";
  }
}

function ResourceIcon({ kind }: { kind: ResourceKind }) {
  switch (kind) {
    case "pdf":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 15h1a2 2 0 0 1 0 4H9v-6z" />
          <path d="M14 13v6" />
          <path d="M18 13v6h-2" />
        </svg>
      );
    case "code":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "ppt":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M8 13h4a2 2 0 0 1 0 4H8v-6z" />
        </svg>
      );
    case "doc":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
          <line x1="8" y1="9" x2="10" y2="9" />
        </svg>
      );
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

interface ResultCardProps {
  result: SearchResult;
  query: string;
}

export function ResultCard({ result, query }: ResultCardProps) {
  const kind = detectResourceKind(result);
  const iconClasses = getResourceIconClasses(kind);
  const badgeClasses = getBadgeClasses(kind);
  const badgeLabel = getBadgeLabel(kind);
  const resourceTypeLabel = getResourceTypeLabel(kind);

  const resultAny = result as unknown as Record<string, unknown>;
  const metadataAny = (result.metadata ?? {}) as Record<string, unknown>;
  const authorName =
    (metadataAny.author_name as string) ??
    (metadataAny.author as string) ??
    (resultAny.author_name as string) ??
    null;
  const createdAt =
    (metadataAny.created_at as string) ??
    (resultAny.created_at as string) ??
    null;
  const fileExtension = (metadataAny.file_extension as string) ?? null;

  const descriptionRaw =
    (metadataAny.description as string) ??
    result.snippet ??
    metadataAny.key_snippet ??
    "Study resource curated for quick reference and review.";
  const description = descriptionRaw
    .replaceAll("<b>", "")
    .replaceAll("</b>", "")
    .trim();

  const tags: string[] = [];
  if (result.metadata.course_code) tags.push(result.metadata.course_code);
  if (result.metadata.level) tags.push(`${result.metadata.level} Level`);
  if (result.metadata.programming_language) tags.push(result.metadata.programming_language);

  const courseCode = result.metadata.course_code;

  const displayDate = formatDate(createdAt);

  return (
    <Link
      href={`/documents/${result.document_id}`}
      className="card card-hover block"
      style={{ border: "1px solid #e2e8f0" }}
    >
      <div className="p-5">
        <div className="flex gap-4">
          <div className={iconClasses}>
            <ResourceIcon kind={kind} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900 leading-snug truncate">
                  {result.title}
                </h3>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  {courseCode && <span>{courseCode}</span>}
                  {courseCode && (
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                  )}
                  <span>{resourceTypeLabel}</span>
                  {authorName && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{authorName}</span>
                    </>
                  )}
                  {fileExtension && !authorName && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>.{fileExtension.replace(/^\./, "")}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {displayDate && (
                  <span className="text-xs text-slate-400 font-medium">
                    {displayDate}
                  </span>
                )}
                <span className={badgeClasses}>{badgeLabel}</span>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-2">
              {highlightQuery(description, query)}
            </p>

            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
