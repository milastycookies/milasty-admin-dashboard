"use server";

import { redirect } from "next/navigation";
import { setAuthCookies, clearAuthCookies, getAccessToken } from "@/lib/session";

export type LoginState = { error: string } | undefined;

const BACKEND_URL = process.env.BACKEND_API_URL!;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email    = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, remember }),
    });
  } catch {
    return { error: "Cannot connect to authentication service. Please try again." };
  }

  if (res.status === 429) {
    return { error: "Too many login attempts. Please wait 15 minutes and try again." };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    return { error: body.error ?? "Invalid email or password." };
  }

  const { accessToken, refreshToken } = await res.json() as {
    accessToken: string;
    refreshToken: string;
  };

  await setAuthCookies(accessToken, refreshToken, remember);
  redirect("/");
}

export async function logout(): Promise<void> {
  // Notify backend to invalidate all refresh tokens for this user
  const token = await getAccessToken();
  if (token) {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined); // Don't fail if backend temporarily unreachable
  }

  await clearAuthCookies();
  redirect("/login");
}
