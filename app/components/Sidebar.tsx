"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

export type SidebarUser = {
  name: string;
  email: string;
  initials: string;
  role: string;
};

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/orders",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/products",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: "Customers",
    href: "/customers",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

/* Bottom nav shows primary items; Settings lives in the More drawer */
const bottomNavItems = navItems.slice(0, 5);
const settingsItem = navItems[5];

type Props = { user?: SidebarUser };

export default function Sidebar({ user }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const displayName     = user?.name     ?? "Milasty Admin";
  const displayEmail    = user?.email    ?? "admin@milasty.com";
  const displayInitials = user?.initials ?? "MA";
  const displayRole     = user?.role     ?? "admin";

  const DesktopSidebarContent = () => (
    <div className="flex flex-col h-full sidebar-scroll overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-7 border-b border-espresso-700/50">
        <div className="w-9 h-9 rounded-xl bg-terracotta-500 flex items-center justify-center shadow-md">
          <span className="text-sand-50 font-bold text-lg leading-none">M</span>
        </div>
        <div>
          <span className="text-sand-100 font-semibold text-lg tracking-wide">Milasty</span>
          <p className="text-sand-400 text-[11px] leading-tight uppercase tracking-widest mt-0.5">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-espresso-600/80 text-[10px] uppercase tracking-widest font-semibold px-3 mb-3">Main Menu</p>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-terracotta-500 text-sand-50 shadow-sm"
                  : "text-sand-300 hover:bg-espresso-700 hover:text-sand-100",
              ].join(" ")}
            >
              <span className={active ? "text-sand-50" : "text-sand-400"}>{item.icon}</span>
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sand-50/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User profile + logout */}
      <div className="px-3 py-4 border-t border-espresso-700/50 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-sand-400 flex items-center justify-center flex-shrink-0">
            <span className="text-espresso-900 font-semibold text-sm">{displayInitials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sand-100 text-sm font-medium truncate">{displayName}</p>
            <p className="text-sand-500 text-[11px] truncate">{displayEmail}</p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-espresso-600/60 bg-espresso-800 px-1.5 py-0.5 rounded flex-shrink-0">
            {displayRole}
          </span>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sand-400 hover:bg-espresso-700 hover:text-sand-200 transition-all text-sm font-medium group"
          >
            <svg className="w-4 h-4 flex-shrink-0 group-hover:text-terracotta-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Desktop sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-espresso-900 h-full">
        <DesktopSidebarContent />
      </aside>

      {/* ─── Mobile: fixed bottom navigation bar ─── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-espresso-900 border-t border-espresso-700/50 safe-area-bottom"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch">
          {bottomNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors",
                  active ? "text-terracotta-400" : "text-sand-500 hover:text-sand-300",
                ].join(" ")}
              >
                <span>{item.icon}</span>
                <span className={["text-[9px] font-medium leading-none", active ? "font-semibold" : ""].join(" ")}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More button → slide-up drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="More options"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-sand-500 hover:text-sand-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-[9px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ─── Mobile: slide-up drawer (Settings + profile + logout) ─── */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-espresso-950/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-espresso-900 rounded-t-2xl safe-area-bottom overflow-hidden">
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-espresso-600 mx-auto mt-3 mb-5" />

            {/* User profile */}
            <div className="flex items-center gap-3 px-5 pb-4 border-b border-espresso-700/50">
              <div className="w-10 h-10 rounded-full bg-sand-400 flex items-center justify-center flex-shrink-0">
                <span className="text-espresso-900 font-semibold">{displayInitials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sand-100 font-medium text-sm truncate">{displayName}</p>
                <p className="text-sand-500 text-xs truncate">{displayEmail}</p>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-espresso-600/60 bg-espresso-800 px-1.5 py-0.5 rounded flex-shrink-0">
                {displayRole}
              </span>
            </div>

            {/* Settings */}
            <Link
              href={settingsItem.href}
              onClick={() => setDrawerOpen(false)}
              className={[
                "flex items-center gap-3 px-5 py-4 transition-colors",
                pathname === settingsItem.href
                  ? "text-terracotta-400 bg-espresso-800"
                  : "text-sand-300 hover:bg-espresso-800",
              ].join(" ")}
            >
              <span>{settingsItem.icon}</span>
              <span className="text-sm font-medium">{settingsItem.label}</span>
              {pathname === settingsItem.href && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-terracotta-400" />
              )}
            </Link>

            {/* Logout */}
            <div className="px-5 py-4">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-terracotta-500/10 text-terracotta-400 text-sm font-semibold hover:bg-terracotta-500/20 active:bg-terracotta-500/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
