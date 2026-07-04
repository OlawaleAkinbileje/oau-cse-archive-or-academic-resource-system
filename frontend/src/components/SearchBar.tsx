"use client";

import { useEffect, useState } from "react";

interface SearchBarProps {
  initialQuery?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  submitLabel?: string;
}

export function SearchBar({
  initialQuery = "",
  onSearch,
  placeholder = "Search algorithms, code snippets, Python tutorials...",
  compact = false,
  submitLabel = "Search",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    // Sync local state with initialQuery prop only when it changes externally
    if (query !== initialQuery) {
      // Use queueMicrotask to schedule state update after render cycle completes,
      // preventing synchronous setState in effect that causes cascading renders
      queueMicrotask(() => setQuery(initialQuery));
    }
  }, [initialQuery]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(query.trim());
      }}
      className={`flex w-full items-center ${compact ? "gap-3" : "gap-4"}`}
    >
      <div className="input-surface neon-outline relative flex flex-1 items-center overflow-hidden px-4">
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
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-500 ${compact ? "h-14 px-3" : "h-16 px-4 text-lg"
            }`}
        />
      </div>
      <button
        type="submit"
        className={`primary-button shrink-0 ${compact ? "px-5 py-3.5 text-sm" : "px-7 py-4 text-sm md:text-base"}`}
      >
        {submitLabel}
      </button>
    </form>
  );
}
