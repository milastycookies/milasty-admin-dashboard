"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard error]", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-terracotta-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-terracotta-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-espresso-800 mb-1">Failed to load data</h2>
        <p className="text-sm text-espresso-600/60 mb-5">
          {error.message ?? "An unexpected error occurred while fetching this page."}
        </p>
        <button
          onClick={reset}
          className="bg-terracotta-500 hover:bg-terracotta-600 text-sand-50 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
