import "server-only";
import { cookies } from "next/headers";

export const ACCESS_COOKIE  = "milasty_access";
export const REFRESH_COOKIE = "milasty_refresh";

// Legacy type retained so dal.ts and dashboard layout stay unchanged
export type SessionUser = {
  sub: string;
  name: string;
  email: string;
  role: string;
};

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  remember: boolean
): Promise<void> {
  const jar = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  jar.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 15 * 60, // 15 minutes — middleware transparently refreshes
    path: "/",
  });

  jar.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
    path: "/",
  });
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}
