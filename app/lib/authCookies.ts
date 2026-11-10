import { createHash } from "node:crypto";
import type { NextResponse } from "next/server";
import pool from "./db";
import { signAccessToken, signRefreshToken } from "./auth";

const base = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function setAccessCookie(response: NextResponse, accessToken: string) {
  response.cookies.set("accessToken", accessToken, {
    ...base,
    maxAge: 60 * 15,
  });
}

export function setRefreshCookie(response: NextResponse, refreshToken: string) {
  response.cookies.set("refreshToken", refreshToken, {
    ...base,
    maxAge: REFRESH_TTL_MS / 1000,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("accessToken", "", { ...base, maxAge: 0 });
  response.cookies.set("refreshToken", "", { ...base, maxAge: 0 });
}

// Signs a new token pair, stores the refresh token's hash, and returns both.
export async function issueSession(userId: number) {
  const accessToken = await signAccessToken(userId);
  const refreshToken = await signRefreshToken(userId);
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, hashToken(refreshToken), new Date(Date.now() + REFRESH_TTL_MS)],
  );
  return { accessToken, refreshToken };
}
