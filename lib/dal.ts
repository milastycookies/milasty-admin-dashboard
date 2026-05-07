import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getAccessToken } from "./session";
import type { SessionUser } from "./session";

const BACKEND_URL = process.env.BACKEND_API_URL!;

/**
 * Verify the current session by calling the backend /auth/me endpoint.
 * The result is React-cached so it executes at most once per render tree.
 * Redirects to /login if unauthenticated.
 */
export const verifySession = cache(async (): Promise<SessionUser> => {
  const token = await getAccessToken();
  if (!token) redirect("/login");

  const res = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) redirect("/login");

  const { user } = await res.json() as { user: SessionUser };
  return user;
});

/**
 * Same as verifySession but returns null instead of redirecting.
 */
export const getOptionalSession = cache(async (): Promise<SessionUser | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const { user } = await res.json() as { user: SessionUser };
  return user;
});
