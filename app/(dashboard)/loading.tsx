export default function DashboardLoading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex items-center gap-3 text-espresso-600/50">
        <svg className="animate-spin w-5 h-5 text-terracotta-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium">Loading…</span>
      </div>
    </div>
  );
}
