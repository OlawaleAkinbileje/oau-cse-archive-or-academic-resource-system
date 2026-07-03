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

interface ResultCardProps {
  result: SearchResult;
  query: string;
}

export function ResultCard({ result, query }: ResultCardProps) {
  const snippet = result.snippet ?? result.metadata.key_snippet ?? "No preview snippet available.";
  const previewBlock = snippet
    .replaceAll("<b>", "")
    .replaceAll("</b>", "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  return (
    <article className="glass-card group overflow-hidden p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill">{result.metadata.programming_language ?? "resource"}</span>
            {result.metadata.course_code && <span className="status-pill">{result.metadata.course_code}</span>}
            {result.metadata.level && <span className="status-pill">{result.metadata.level} level</span>}
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{result.title}</h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{highlightQuery(snippet, query)}</p>
        </div>
        <div className="glass-card-soft neon-outline min-w-0 overflow-hidden p-4 lg:w-[320px]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Snippet Preview</p>
          <pre className="overflow-x-auto text-xs leading-6 text-slate-600">
            <code>
              {previewBlock.length > 0
                ? previewBlock.map((line, index) => (
                  <div key={`${result.document_id}-${index}`} className="grid grid-cols-[20px_1fr] gap-3">
                    <span className="text-slate-400">{index + 1}</span>
                    <span className="truncate">{line}</span>
                  </div>
                ))
                : "No code preview available."}
            </code>
          </pre>
        </div>
        <div className="flex items-center justify-between gap-4 lg:block lg:w-28 lg:text-right">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500">Score</p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">{Math.round(result.relevance_score)}</p>
          </div>
          <Link
            href={`/documents/${result.document_id}`}
            className="primary-button px-5 py-3 text-sm"
          >
            View
          </Link>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
        <span>Curated for quick study and code review.</span>
        <span className="h-1 w-1 rounded-full bg-slate-400" />
        <span>Open the detail view for preview and discussion.</span>
      </div>
    </article>
  );
}
