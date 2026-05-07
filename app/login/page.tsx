"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <div className="min-h-screen bg-sand-50 flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-espresso-900 p-12 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta-500 flex items-center justify-center shadow-lg">
            <span className="text-sand-50 font-bold text-xl leading-none">M</span>
          </div>
          <div>
            <span className="text-sand-100 font-semibold text-xl tracking-wide">Milasty</span>
            <p className="text-sand-400 text-[11px] uppercase tracking-widest mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Quote */}
        <div>
          <blockquote className="text-sand-200 text-2xl font-light leading-relaxed">
            &ldquo;Premium artisan cookies, crafted with love and shipped with care.&rdquo;
          </blockquote>
          <p className="text-sand-500 text-sm mt-4">— Milasty Cookies, 2026</p>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 mt-10">
            {[
              { value: "1,284", label: "Orders" },
              { value: "892",   label: "Customers" },
              { value: "$48k",  label: "Revenue" },
            ].map((s) => (
              <div key={s.label} className="bg-espresso-800 rounded-xl p-4">
                <p className="text-sand-100 text-xl font-bold">{s.value}</p>
                <p className="text-sand-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-espresso-600/80 text-xs">© 2026 Milasty Cookies · All rights reserved</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-terracotta-500 flex items-center justify-center">
              <span className="text-sand-50 font-bold text-lg leading-none">M</span>
            </div>
            <span className="text-espresso-800 font-semibold text-lg">Milasty Admin</span>
          </div>

          <h1 className="text-2xl font-bold text-espresso-800">Welcome back</h1>
          <p className="text-espresso-600/60 text-sm mt-1">Sign in to your admin dashboard</p>

          {/* Error banner */}
          {state?.error && (
            <div className="mt-5 flex items-start gap-2.5 bg-terracotta-500/10 border border-terracotta-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-terracotta-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-terracotta-600 font-medium">{state.error}</p>
            </div>
          )}

          <form action={formAction} className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-espresso-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-espresso-600/40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue="admin@milasty.com"
                  placeholder="admin@milasty.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-sand-200 rounded-xl text-sm text-espresso-800 placeholder:text-espresso-600/40 outline-none focus:border-espresso-400 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-espresso-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-espresso-600/40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  defaultValue="Admin@123"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white border border-sand-200 rounded-xl text-sm text-espresso-800 placeholder:text-espresso-600/40 outline-none focus:border-espresso-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-espresso-600/40 hover:text-espresso-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setRemember((v) => !v)}
                className={[
                  "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                  remember
                    ? "bg-terracotta-500 border-terracotta-500"
                    : "bg-white border-sand-300 hover:border-sand-400",
                ].join(" ")}
              >
                {remember && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                name="remember"
                checked={remember}
                onChange={() => setRemember((v) => !v)}
                className="sr-only"
              />
              <span className="text-sm text-espresso-600/70">Remember me for 7 days</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 disabled:cursor-not-allowed text-sand-50 font-semibold text-sm py-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in to Dashboard
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 bg-espresso-900 rounded-xl">
            <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-widest mb-2">Demo credentials</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-sand-400">Email</span>
                <span className="text-xs text-sand-200 font-mono">admin@milasty.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-sand-400">Password</span>
                <span className="text-xs text-sand-200 font-mono">Admin@123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
