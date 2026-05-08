import "server-only";
import { redirect } from "next/navigation";
import { getAccessToken } from "./session";

const BACKEND_URL = process.env.BACKEND_API_URL;
if (!BACKEND_URL) {
  throw new Error("BACKEND_API_URL environment variable is required but not set.");
}

/**
 * Server-side fetch helper. Attaches the current user's access token as a
 * Bearer credential. The token is never exposed to the browser.
 *
 * 401 → middleware should have refreshed the token; if we still get one here,
 * the session is gone and we redirect to login.
 */
export async function apiFetch<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  if (!token) redirect("/login");

  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? "API request failed");
  }

  return res.json() as Promise<T>;
}
