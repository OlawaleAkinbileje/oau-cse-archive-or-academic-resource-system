"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

interface CodePreviewProps {
  language: string;
  code: string;
  filename?: string;
  editable?: boolean;
  onChange?: (newCode: string) => void;
}

const languageMap: Record<string, string> = {
  python: "python",
  py: "python",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  java: "java",
  cpp: "cpp",
  c: "c",
  "c++": "cpp",
  csharp: "csharp",
  cs: "csharp",
  php: "php",
  ruby: "ruby",
  rb: "ruby",
  go: "go",
  golang: "go",
  rust: "rust",
  rs: "rust",
  kotlin: "kotlin",
  kt: "kotlin",
  swift: "swift",
  html: "html",
  xml: "xml",
  css: "css",
  scss: "scss",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  markdown: "markdown",
  md: "markdown",
  sql: "sql",
  bash: "bash",
  shell: "bash",
  sh: "bash",
  powershell: "powershell",
  ps1: "powershell",
};

export function CodePreview({
  language,
  code,
  filename,
  editable = false,
  onChange,
}: CodePreviewProps) {
  const normalizedLang = languageMap[language?.toLowerCase() || ""] || "text";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayFilename = filename || `code.${normalizedLang}`;

  return (
    <div className="code-block relative border border-slate-700 rounded-2xl overflow-hidden shadow-lg bg-[#0f172a]">
      <div className="code-header flex items-center justify-between px-4 md:px-5 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-sm font-mono text-slate-300">
            {displayFilename}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            copied
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : "border-slate-600 bg-transparent text-slate-300 hover:border-slate-500 hover:bg-slate-800/50 hover:text-slate-100"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" strokeWidth={2} />
              Copy Code
            </>
          )}
        </button>
      </div>
      {editable ? (
        <textarea
          value={code}
          onChange={(e) => onChange?.(e.currentTarget.value)}
          className="w-full h-[500px] overflow-x-auto bg-[#0f172a] p-5 text-sm leading-7 text-slate-100 resize-vertical outline-none font-mono"
          spellCheck={false}
        />
      ) : (
        <div className="max-h-[800px] overflow-auto">
          <SyntaxHighlighter
            language={normalizedLang}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1.25rem 1.5rem",
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
            {code}
          </SyntaxHighlighter>
        </div>
      )}
      {copied && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 backdrop-blur border border-emerald-500/30 px-3.5 py-2 shadow-lg">
            <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.5} />
            <span className="text-xs font-medium text-emerald-300">
              Copied
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
