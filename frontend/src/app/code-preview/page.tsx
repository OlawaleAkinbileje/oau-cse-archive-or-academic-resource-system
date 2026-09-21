"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Code2, Copy, Check } from "lucide-react";

const codeSample = `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
# Example usage
my_list = [1, 3, 5, 7, 9, 11]`;

type TabKey = "preview" | "code" | "details";

export default function CodePreviewPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("code");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeSample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = codeSample;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "preview", label: "Preview" },
    { key: "code", label: "Code Block" },
    { key: "details", label: "Details" },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      <header className="bg-[#1e293b] border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 md:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-[#0a1628] border border-slate-600 text-sky-400 flex-shrink-0">
                <Code2 className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-slate-50 tracking-tight">
                  Implementation of Binary Search in Python
                </h1>
                <p className="mt-1 text-xs md:text-sm text-slate-400">
                  CSC 201 - Data Structures • By Mr. O. Akinwale
                </p>
              </div>
            </div>
            <span className="flex-shrink-0 inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              CODE EXAMPLE
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex gap-1 border-b border-slate-700/50 -mb-px">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 md:px-6 py-3 text-sm font-medium transition-colors relative ${
                    isActive
                      ? "text-slate-100"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4a017] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
          {activeTab === "code" && (
            <div className="code-block border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
              <div className="code-header flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 border-b border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="ml-2 text-sm font-mono text-slate-300">
                    binary_search.py
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                    copied
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-600 bg-transparent text-slate-300 hover:border-slate-500 hover:bg-slate-800/50 hover:text-slate-100"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" strokeWidth={2} />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <div className="overflow-auto">
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: "1.5rem",
                    fontSize: "0.875rem",
                    lineHeight: "1.75rem",
                    background: "#0f172a",
                    borderRadius: 0,
                  }}
                  showLineNumbers
                  wrapLines
                  lineNumberStyle={{
                    minWidth: "3.5rem",
                    paddingRight: "1rem",
                    textAlign: "right",
                    userSelect: "none",
                    opacity: 0.5,
                    color: "#64748b",
                  }}
                >
                  {codeSample}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-sm font-medium text-emerald-400">
                  Live Preview
                </p>
              </div>
              <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-5 font-mono text-sm text-slate-200 space-y-2">
                <p className="text-slate-400"># Running binary_search...</p>
                <p>
                  <span className="text-sky-400">Input list:</span> [1, 3, 5, 7,
                  9, 11]
                </p>
                <p>
                  <span className="text-sky-400">Search for 7:</span>{" "}
                  <span className="text-emerald-400 font-semibold">
                    index 3 ✓
                  </span>
                </p>
                <p>
                  <span className="text-sky-400">Search for 4:</span>{" "}
                  <span className="text-rose-400 font-semibold">not found -1</span>
                </p>
                <p className="pt-2 border-t border-slate-700/50 text-slate-400">
                  Time complexity: O(log n) • Space: O(1)
                </p>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 md:p-8 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-100 mb-2">
                  Algorithm Description
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Binary search is an efficient algorithm for finding items in a
                  sorted list by repeatedly dividing the search interval in half.
                  Beginning with a range covering the entire list, it compares
                  the target with the middle element and narrows the range by
                  half each iteration.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Time Complexity
                  </p>
                  <p className="text-lg font-bold text-sky-400">O(log n)</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Logarithmic in the size of the list
                  </p>
                </div>
                <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Space Complexity
                  </p>
                  <p className="text-lg font-bold text-emerald-400">O(1)</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Constant auxiliary space (iterative)
                  </p>
                </div>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-100 mb-2">
                  Preconditions
                </h2>
                <ul className="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>The input array must be sorted in ascending order</li>
                  <li>All elements must be comparable with the target type</li>
                  <li>For large datasets, this is significantly faster than linear search</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {copied && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 backdrop-blur border border-emerald-500/30 px-4 py-3 shadow-lg">
            <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
            <span className="text-sm font-medium text-emerald-300">
              Code copied to clipboard
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
