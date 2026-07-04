"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BackButton } from "@/components/BackButton";
import { FiltersSidebar } from "@/components/FiltersSidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ResultCard } from "@/components/ResultCard";
import { SearchBar } from "@/components/SearchBar";
import { WorkspaceRail } from "@/components/WorkspaceRail";
import { searchDocuments } from "@/lib/api";
import { SearchFilters, SearchResult } from "@/types";

function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (filters.level) labels.push(`${filters.level} level`);
    if (filters.courseCode) labels.push(filters.courseCode.toUpperCase());
    if (filters.fileType) labels.push(filters.fileType === "code" ? "Python code" : filters.fileType.toUpperCase());
    return labels;
  }, [filters]);

  useEffect(() => {
    let isMounted = true;

    const performSearch = async () => {
      if (!query.trim()) return;

      await Promise.resolve();
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        const data = await searchDocuments(query, filters);
        if (isMounted) {
          setResults(data);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load search results.";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void performSearch();

    return () => {
      isMounted = false;
    };
  }, [filters, query]);

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

            <div className="flex-1 space-y-8 min-w-0">
              <section className="glass-panel p-6 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10" />
                <div className="relative z-10">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <BackButton fallbackHref="/" label="Back to Home" />
                      <div className="flex flex-wrap gap-3">
                        <button type="button" className="status-pill border-cyan-300/40 bg-cyan-300/10 text-blue-700">
                          Relevance
                        </button>
                        <button type="button" className="status-pill">
                          Archive Ready
                        </button>
                        <button type="button" className="status-pill">
                          Preview View
                        </button>
                      </div>
                    </div>
                    <div className="max-w-2xl">
                      <p className="section-label">Search Workspace</p>
                      <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
                        {query ? `Results for "${query}"` : "Browse the archive"}
                      </h1>
                      <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                        Refine the search experience with our clean interface, quick filters, and preview-first result cards.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <SearchBar
                      initialQuery={query}
                      compact
                      submitLabel="Run Search"
                      onSearch={(nextQuery) => {
                        setQuery(nextQuery);
                        router.push(`/results?q=${encodeURIComponent(nextQuery)}`);
                      }}
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className="status-pill">{results.length} result{results.length === 1 ? "" : "s"}</span>
                    {activeFilterLabels.map((label) => (
                      <span key={label} className="status-pill">
                        {label}
                      </span>
                    ))}
                    {!query && <span className="text-sm text-muted">Enter a keyword to start searching the repository.</span>}
                  </div>
                </div>
              </section>

              <section className="flex flex-col xl:flex-row gap-8">
                <FiltersSidebar
                  filters={filters}
                  onChange={(nextFilters) => {
                    setFilters(nextFilters);
                  }}
                />

                <div className="flex-1 space-y-6 min-w-0">
                  {loading && (
                    <div className="glass-panel py-12">
                      <LoadingSpinner />
                      <p className="mt-2 text-center text-sm font-medium text-slate-600">Scanning archive resources...</p>
                    </div>
                  )}

                  {error && (
                    <div className="glass-panel border-rose-400/30 bg-rose-50 p-4 text-sm text-rose-700">
                      {error}
                    </div>
                  )}

                  {!loading && !error && !query && (
                    <div className="glass-panel p-10 text-center">
                      <p className="text-xl font-semibold text-slate-900">Start with a topic, course code, or language.</p>
                      <p className="mt-3 text-sm text-muted">Example searches: Dijkstra, CSC401, Python, database systems.</p>
                    </div>
                  )}

                  {!loading && !error && query && results.length === 0 && (
                    <div className="glass-panel p-10 text-center">
                      <p className="text-xl font-semibold text-slate-900">No results found.</p>
                      <p className="mt-3 text-sm text-muted">Try broader keywords or clear one of the active filters.</p>
                    </div>
                  )}

                  {!loading &&
                    results.map((result) => <ResultCard key={result.document_id} result={result} query={query} />)}
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

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
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
              <p className="mt-2 text-sm text-slate-600">Preparing search workspace...</p>
            </section>
          </div>
        </main>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
}
