import { timingSafeEqual } from "node:crypto";
import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  issueSession,
  setAccessCookie,
  setRefreshCookie,
} from "@/app/lib/authCookies";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  googleRedirectUri,
} from "@/app/lib/oauthState";
import { safeNext } from "@/app/lib/safeNext";

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
  clearOauthCookies(response);
  return response;
}

function clearOauthCookies(response: NextResponse) {
  for (const name of [OAUTH_STATE_COOKIE, OAUTH_NEXT_COOKIE]) {
    response.cookies.delete({ name, path: "/api/auth/google" });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const next = safeNext(cookieStore.get(OAUTH_NEXT_COOKIE)?.value ?? null);

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
        redirect_uri: googleRedirectUri(request),
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
      new URL(`/auth/success?next=${encodeURIComponent(next)}`, request.url),
    );
    clearOauthCookies(response);
    setRefreshCookie(response, refreshToken);
    setAccessCookie(response, accessToken);
    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return fail(request, "GoogleAuthError");
  }
}
