"use client";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-sand-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="pl-10 lg:pl-0">
        <h1 className="text-lg font-semibold text-espresso-800">{title}</h1>
        {subtitle && <p className="text-xs text-espresso-600/60">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="hidden sm:flex items-center gap-2 bg-sand-100 rounded-xl px-3 py-2 w-48 border border-sand-200 focus-within:border-sand-400 transition-colors">
          <svg className="w-4 h-4 text-espresso-600/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search…"
            className="bg-transparent text-sm text-espresso-800 placeholder:text-espresso-600/40 outline-none w-full"
          />
        </div>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-sand-100 border border-sand-200 text-espresso-700 hover:bg-sand-200 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-terracotta-500 border border-white" />
        </button>
      </div>
    </header>
  );
}
