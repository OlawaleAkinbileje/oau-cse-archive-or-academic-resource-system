import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodePreviewProps {
  language: string;
  code: string;
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

export function CodePreview({ language, code, editable = false, onChange }: CodePreviewProps) {
  const normalizedLang = languageMap[language?.toLowerCase() || ""] || "text";

  return (
    <div className="glass-card-soft overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          {language || "text"}
        </span>
      </div>
      {editable ? (
        <textarea
          value={code}
          onChange={(e) => onChange?.(e.currentTarget.value)}
          className="w-full h-[500px] overflow-x-auto bg-slate-900 p-5 text-sm leading-7 text-slate-100 resize-vertical outline-none font-mono"
          spellCheck={false}
        />
      ) : (
        <div className="max-h-[800px] overflow-auto">
          <SyntaxHighlighter
            language={normalizedLang}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1.25rem",
              fontSize: "0.875rem",
              lineHeight: "1.75rem",
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
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}
