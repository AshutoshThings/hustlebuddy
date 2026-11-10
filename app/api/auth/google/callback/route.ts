import { timingSafeEqual } from "node:crypto";
import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  issueSession,
  setAccessCookie,
  setRefreshCookie,
} from "@/app/lib/authCookies";
import { OAUTH_STATE_COOKIE } from "@/app/lib/oauthState";

// Stored in password_hash for accounts that sign in with Google only.
// It is not a bcrypt hash, so no password can ever match it.
const NO_PASSWORD = "GOOGLE_OAUTH_USER_NO_PASSWORD";

function stateMatches(expected: string | undefined, given: string | null) {
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

function fail(request: Request, error: string) {
  const response = NextResponse.redirect(
    new URL(`/auth?error=${error}`, request.url),
  );
  response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth/google" });
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const expectedState = (await cookies()).get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !stateMatches(expectedState, url.searchParams.get("state"))) {
    return fail(request, "GoogleAuthFailed");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri:
          process.env.GOOGLE_REDIRECT_URI ||
          "http://localhost:3000/api/auth/google/callback",
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token)
      throw new Error("Failed to get Google access token");

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    const googleUser = await userRes.json();
    const { name, verified_email } = googleUser;
    const email =
      typeof googleUser.email === "string"
        ? googleUser.email.trim().toLowerCase()
        : "";

    if (!email) throw new Error("Email not found from Google profile");
    if (verified_email !== true) {
      return fail(request, "GoogleEmailNotVerified");
    }

    const userResult = await pool.query(
      "SELECT id, is_verified FROM users WHERE email = $1",
      [email],
    );
    let user = userResult.rows[0];

    if (!user) {
      const insertRes = await pool.query(
        "INSERT INTO users (name, email, password_hash, is_verified) VALUES ($1, $2, $3, true) RETURNING id",
        [name || "User", email, NO_PASSWORD],
      );
      user = insertRes.rows[0];
    } else if (!user.is_verified) {
      // Google just proved who owns this email. Whoever started the unverified
      // signup may not be them, so drop that password and any pending code.
      await pool.query(
        `UPDATE users SET is_verified = true, password_hash = $1, otp = NULL,
           otp_expiry = NULL, otp_purpose = NULL, otp_attempts = 0
         WHERE id = $2`,
        [NO_PASSWORD, user.id],
      );
    }

    const { accessToken, refreshToken } = await issueSession(user.id);

    const response = NextResponse.redirect(
      new URL("/auth/success", request.url),
    );
    response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth/google" });
    setRefreshCookie(response, refreshToken);
    setAccessCookie(response, accessToken);
    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return fail(request, "GoogleAuthError");
  }
}
