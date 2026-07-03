interface CodePreviewProps {
  language: string;
  code: string;
  editable?: boolean;
  onChange?: (newCode: string) => void;
}

export function CodePreview({ language, code, editable = false, onChange }: CodePreviewProps) {
  const tokens = language.toLowerCase().includes("python")
    ? ["def", "class", "import", "return", "if", "for", "while"]
    : ["function", "const", "let", "class", "return", "if", "for"];

  const escaped = code
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const highlighted = tokens.reduce((acc, token) => {
    const regex = new RegExp(`\\b${token}\\b`, "g");
    return acc.replace(regex, `<span class="text-blue-600 font-semibold">${token}</span>`);
  }, escaped);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.currentTarget.value);
    }
  };

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
          onChange={handleInput}
          className="w-full h-[500px] overflow-x-auto bg-slate-900 p-5 text-sm leading-7 text-slate-100 resize-vertical outline-none"
          spellCheck={false}
        />
      ) : (
        <pre className="overflow-x-auto bg-slate-900 p-5 text-sm leading-7 text-slate-100">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      )}
    </div>
  );
}
