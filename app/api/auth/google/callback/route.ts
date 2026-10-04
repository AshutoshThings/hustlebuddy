import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { signAccessToken, signRefreshToken } from "@/app/lib/auth";
import { createHash } from "crypto";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth?error=GoogleAuthFailed", request.url),
    );
  }

  try {
    // 1. Exchange authorization code for tokens from Google
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

    // 2. Fetch user profile from Google
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    const googleUser = await userRes.json();
    const { email, name } = googleUser;

    if (!email) throw new Error("Email not found from Google profile");

    // 3. Check if user exists in PostgreSQL database
    let userResult = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    let user = userResult.rows[0];

    if (!user) {
      // Create user if they don't exist (Mark verified automatically since Google verified them)
      const insertRes = await pool.query(
        "INSERT INTO users (name, email, is_verified) VALUES ($1, $2, true) RETURNING *",
        [name || "User", email],
      );
      user = insertRes.rows[0];
    }

    // 4. Generate tokens matching your login route pattern
    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);
    const hashedRefreshToken = createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Store refresh token hash in database (just like your login route)
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, hashedRefreshToken, expiresAt],
    );

    // 5. Redirect to the client-side success transition page and set cookies exactly like login
    const response = NextResponse.redirect(
      new URL("/auth/success", request.url),
    );

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth?error=GoogleAuthError", request.url),
    );
  }
}
