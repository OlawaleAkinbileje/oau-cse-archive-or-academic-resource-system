"use client";

import { SearchFilters } from "@/types";

interface FiltersSidebarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export function FiltersSidebar({ filters, onChange }: FiltersSidebarProps) {
  const fileTypes: Array<{ label: string; value: SearchFilters["fileType"] | "" }> = [
    { label: "All files", value: "" },
    { label: "Python code", value: "code" },
    { label: "PDF notes", value: "pdf" },
    { label: "Plain text", value: "txt" },
  ];

  return (
    <aside className="glass-panel h-fit w-full p-6 lg:w-80">
      <div className="mb-6">
        <p className="section-label">Search Filters</p>
        <h2 className="mt-3 text-xl font-semibold text-slate-900">Refine your archive view</h2>
        <p className="mt-2 text-sm text-muted">Narrow by level, course code, and the resource format available in the repository.</p>
      </div>
      <div className="space-y-6">
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-slate-700">Course Level</span>
          <input
            value={filters.level ?? ""}
            onChange={(e) => onChange({ ...filters, level: e.target.value })}
            className="input-surface w-full px-4 py-3 outline-none"
            placeholder="e.g. 400"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-slate-700">Course Code</span>
          <input
            value={filters.courseCode ?? ""}
            onChange={(e) => onChange({ ...filters, courseCode: e.target.value })}
            className="input-surface w-full px-4 py-3 uppercase outline-none"
            placeholder="e.g. CSC401"
          />
        </label>
        <div>
          <span className="mb-3 block text-sm font-medium text-slate-700">Resource Type</span>
          <div className="grid gap-3">
            {fileTypes.map((type) => {
              const active = (filters.fileType ?? "") === type.value;
              return (
                <button
                  key={type.label}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...filters,
                      fileType: type.value as SearchFilters["fileType"],
                    })
                  }
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                    active
                      ? "border-blue-300 bg-blue-50 text-blue-700 shadow-[0_0_22px_rgba(59,130,246,0.14)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-slate-900"
                  }`}
                >
                  <span>{type.label}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-blue-500" : "bg-slate-300"}`} />
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({})}
          className="secondary-button w-full text-sm font-semibold"
        >
          Clear filters
        </button>
      </div>
    </aside>
  );
}
