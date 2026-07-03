export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-cyan-300/15 border-t-cyan-300 border-r-blue-400 shadow-[0_0_32px_rgba(34,211,238,0.2)]" />
    </div>
  );
}
