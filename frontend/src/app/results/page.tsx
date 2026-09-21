"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ResultCard } from "@/components/ResultCard";
import { useNavbarSlot } from "@/components/NavbarProvider";
import { searchDocuments } from "@/lib/api";
import { SearchFilters, SearchResult } from "@/types";

const MOCK_RESULTS: SearchResult[] = [
  {
    document_id: 101,
    title: "Binary Search Algorithm - Complete Lecture Notes",
    relevance_score: 0.96,
    snippet: "Binary search is an efficient algorithm for finding items from a sorted list of items. It repeatedly divides in half the portion of the list that could contain the item.",
    file_url: "",
    metadata: {
      course_code: "CSC 201",
      level: "200",
      programming_language: null,
      key_snippet: "Time complexity of binary search is O(log n) compared to linear search O(n).",
    },
  },
  {
    document_id: 102,
    title: "Data Structures & Algorithm Slides - Searching Techniques",
    relevance_score: 0.91,
    snippet: "Covers linear search, binary search, interpolation search, and their performance comparisons with worked examples and complexity analysis.",
    file_url: "",
    metadata: {
      course_code: "CSC 301",
      level: "300",
      programming_language: null,
      key_snippet: "Binary search requires the array to be sorted beforehand. Preprocessing cost must be considered.",
    },
  },
  {
    document_id: 103,
    title: "Binary Search Implementation - Python Code Examples",
    relevance_score: 0.89,
    snippet: "Iterative and recursive implementations of binary search in Python with test cases, edge case handling, and correctness proofs.",
    file_url: "",
    metadata: {
      course_code: "CSC 202",
      level: "200",
      programming_language: "Python",
      key_snippet: "def binary_search(arr, target): left, right = 0, len(arr) - 1",
    },
  },
  {
    document_id: 104,
    title: "Past Questions - Algorithm Design and Analysis",
    relevance_score: 0.84,
    snippet: "Previous exam questions covering binary search, merge sort, quicksort, dynamic programming, and greedy algorithms with solutions.",
    file_url: "",
    metadata: {
      course_code: "CSC 401",
      level: "400",
      programming_language: null,
      key_snippet: "Question 3: Compare linear search vs binary search with a sorted array of 1024 elements.",
    },
  },
  {
    document_id: 105,
    title: "Lab Manual - Searching and Sorting Algorithms Practical",
    relevance_score: 0.81,
    snippet: "Laboratory exercises implementing binary search, bubble sort, insertion sort, and selection sort with performance benchmarking tasks.",
    file_url: "",
    metadata: {
      course_code: "CSC 201",
      level: "200",
      programming_language: null,
      key_snippet: "Exercise 2: Implement binary search and count number of comparisons for different input sizes.",
    },
  },
];

const RESOURCE_TYPES = [
  { label: "Lecture Notes", count: 24, value: "notes" },
  { label: "Slides", count: 18, value: "slides" },
  { label: "Lab Manual", count: 12, value: "lab" },
  { label: "Project", count: 9, value: "project" },
  { label: "Past Questions", count: 7, value: "past" },
  { label: "Code Example", count: 31, value: "code" },
];

const COURSES = [
  { label: "CSC 201", count: 22 },
  { label: "CSC 301", count: 18 },
  { label: "CSC 401", count: 15 },
  { label: "CSC 202", count: 12 },
];

const LEVELS = [
  { label: "100 Level", count: 18, value: "100" },
  { label: "200 Level", count: 32, value: "200" },
  { label: "300 Level", count: 28, value: "300" },
  { label: "400 Level", count: 24, value: "400" },
  { label: "Postgraduate", count: 11, value: "pg" },
];

function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "binary search algorithm";

  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({ level: "200" });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedResourceTypes, setSelectedResourceTypes] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("200");
  const [sortBy, setSortBy] = useState("relevance");
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);

  const displayResults = useMemo(() => {
    if (results.length > 0) return results;
    return MOCK_RESULTS;
  }, [results]);

  const { dynamicCourses, dynamicLevels, dynamicResourceTypes } = useMemo(() => {
    const dc: Record<string, number> = {};
    const dl: Record<string, number> = {};
    const drt: Record<string, number> = {};

    for (const result of displayResults) {
      const cc = result.metadata.course_code;
      if (cc) dc[cc] = (dc[cc] || 0) + 1;

      const lv = result.metadata.level;
      if (lv) dl[lv.toString()] = (dl[lv.toString()] || 0) + 1;

      const title = (result.title || "").toLowerCase();
      const pl = result.metadata.programming_language;
      let type: string;
      if (pl) type = "code";
      else if (title.endsWith(".pdf")) type = "pdf";
      else if (title.endsWith(".ppt") || title.endsWith(".pptx")) type = "slides";
      else if (title.endsWith(".doc") || title.endsWith(".docx")) type = "doc";
      else {
        if (title.includes("slides")) type = "slides";
        else if (title.includes("lecture") || title.includes("notes") || title.includes("note")) type = "pdf";
        else if (title.includes("lab") || title.includes("manual")) type = "doc";
        else type = "other";
      }
      drt[type] = (drt[type] || 0) + 1;
    }

    return { dynamicCourses: dc, dynamicLevels: dl, dynamicResourceTypes: drt };
  }, [displayResults]);

  const mapResourceCount = (value: string): number => {
    switch (value) {
      case "code": return dynamicResourceTypes["code"] || 0;
      case "slides": return dynamicResourceTypes["slides"] || 0;
      case "notes": return dynamicResourceTypes["pdf"] || 0;
      case "lab": return dynamicResourceTypes["doc"] || 0;
      case "past": return dynamicResourceTypes["other"] || 0;
      case "project": return 0;
      default: return 0;
    }
  };

  const resourceTypes = useMemo(() => {
    return RESOURCE_TYPES.map((rt) => ({
      ...rt,
      count: displayResults.length === 0 ? rt.count : mapResourceCount(rt.value),
    }));
  }, [dynamicResourceTypes, displayResults.length]);

  const courses = useMemo(() => {
    return COURSES.map((c) => ({
      ...c,
      count: displayResults.length === 0 ? c.count : dynamicCourses[c.label] || 0,
    }));
  }, [dynamicCourses, displayResults.length]);

  const levels = useMemo(() => {
    return LEVELS.map((lv) => ({
      ...lv,
      count: displayResults.length === 0 ? lv.count : dynamicLevels[lv.value] || 0,
    }));
  }, [dynamicLevels, displayResults.length]);

  const resultsCount = displayResults.length > 0 ? 78 : 0;

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setQuery(q);
    router.push(`/results?q=${encodeURIComponent(q)}`);
  };

  useNavbarSlot(
    "center",
    (
      <div className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <svg
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search documents, courses, code..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d4a017]/20 focus:border-[#d4a017]/40 focus:bg-white transition-all"
          />
        </form>
      </div>
    ),
    [searchInput],
  );

  const toggleResourceType = (value: string) => {
    setSelectedResourceTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleCourse = (label: string) => {
    setSelectedCourses((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    );
    const code = label.replace(" ", "");
    setFilters((prev) => {
      const nextCourses = selectedCourses.includes(label)
        ? selectedCourses.filter((v) => v !== label)
        : [...selectedCourses, label];
      return { ...prev, courseCode: nextCourses.length > 0 ? code : undefined };
    });
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
    setFilters((prev) => ({ ...prev, level: value === "pg" ? undefined : value }));
  };

  const clearAllFilters = () => {
    setSelectedResourceTypes([]);
    setSelectedCourses([]);
    setSelectedLevel("200");
    setFilters({ level: "200" });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-4 pb-8">
        <div className="flex gap-6">
          <aside
            className="hidden md:block w-[220px] flex-shrink-0 sticky top-20 self-start bg-white rounded-2xl border border-slate-200 shadow-sm"
            style={{ padding: "1.5rem" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Resource Type</h3>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-navy hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="mb-7">
              {resourceTypes.map((rt) => (
                <label key={rt.value} className="filter-checkbox text-sm">
                  <input
                    type="checkbox"
                    checked={selectedResourceTypes.includes(rt.value)}
                    onChange={() => toggleResourceType(rt.value)}
                  />
                  <span className="flex-1 text-slate-700">{rt.label}</span>
                  <span className="text-xs text-slate-400 font-medium">{rt.count}</span>
                </label>
              ))}
            </div>

            <div className="mb-7">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Course</h3>
              <div className="relative mb-3">
                <button
                  type="button"
                  onClick={() => setCourseDropdownOpen((o) => !o)}
                  className="w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  <span>All Courses</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${courseDropdownOpen ? "rotate-180" : ""}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
              {courses.map((c) => (
                <label key={c.label} className="filter-checkbox text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(c.label)}
                    onChange={() => toggleCourse(c.label)}
                  />
                  <span className="flex-1 text-slate-700">{c.label}</span>
                  <span className="text-xs text-slate-400 font-medium">{c.count}</span>
                </label>
              ))}
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Level</h3>
              {levels.map((lv) => (
                <label key={lv.value} className="filter-checkbox text-sm">
                  <input
                    type="radio"
                    name="level"
                    value={lv.value}
                    checked={selectedLevel === lv.value}
                    onChange={() => handleLevelChange(lv.value)}
                  />
                  <span className="flex-1 text-slate-700">{lv.label}</span>
                  <span className="text-xs text-slate-400 font-medium">{lv.count}</span>
                </label>
              ))}
            </div>
          </aside>

          <section className="flex-1 min-w-0 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-slate-600">
                  About{" "}
                  <span className="font-semibold text-slate-900">{resultsCount}</span>{" "}
                  results for{" "}
                  <span className="font-semibold text-navy">&quot;{query}&quot;</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all cursor-pointer"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>

            {loading && (
              <div className="card p-12">
                <div className="flex flex-col items-center">
                  <LoadingSpinner />
                  <p className="mt-4 text-center text-sm font-medium text-slate-600">Scanning archive resources...</p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="card border-rose-400/30 bg-rose-50 p-4 text-sm text-rose-700">
                {error} - Showing cached preview results.
              </div>
            )}

            {!loading && displayResults.length === 0 && (
              <div className="card p-10 text-center">
                <p className="text-xl font-semibold text-slate-900">No results found.</p>
                <p className="mt-3 text-sm text-muted">Try broader keywords or clear one of the active filters.</p>
              </div>
            )}

            {!loading && displayResults.length > 0 && (
              <div className="space-y-4">
                {displayResults.map((result) => (
                  <ResultCard key={result.document_id} result={result} query={query} />
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-4 pb-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(5, p + 1))}
                disabled={currentPage === 5}
                className="pagination-btn disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
}
