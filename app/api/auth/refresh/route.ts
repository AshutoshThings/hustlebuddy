import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signRefreshToken, signAccessToken, verifyToken } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import {
  clearAuthCookies,
  hashToken,
  REFRESH_TTL_MS,
  setAccessCookie,
  setRefreshCookie,
} from "@/app/lib/authCookies";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return sessionOverResponse();
  }

  const jwtVerificationResult = await verifyToken(
    refreshToken,
    process.env.JWT_REFRESH_SECRET!,
  );

  if (!jwtVerificationResult) {
    return sessionOverResponse();
  }

  const tokenHash = hashToken(refreshToken);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the row for the duration of the transaction so a concurrent
    // request using the same refresh token must wait until we commit.
    const result = await client.query(
      "SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > now() FOR UPDATE",
      [tokenHash],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      // Another tab may have rotated this token a moment ago and already
      // set new cookies; clearing them here would sign that tab out too.
      const justRotated = await pool.query(
        `SELECT 1 FROM refresh_tokens
         WHERE user_id = $1 AND revoked = false
           AND created_at > now() - interval '30 seconds'`,
        [jwtVerificationResult.userId],
      );
      return justRotated.rows.length
        ? unauthorizedResponse()
        : sessionOverResponse();
    }

    const userId = result.rows[0].user_id;
    const newAccessToken = await signAccessToken(userId);
    const newRefreshToken = await signRefreshToken(userId);
    const hashedNewRefreshToken = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await client.query(
      "UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1",
      [tokenHash],
    );
    await client.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [userId, hashedNewRefreshToken, expiresAt],
    );
    await client.query("COMMIT");

    // set the new refresh token in the cookie
    const response = NextResponse.json(
      { accessToken: newAccessToken },
      { status: 200 },
    );
    setRefreshCookie(response, newRefreshToken);
    // Same-origin requests that can't send headers (EventSource) use this.
    setAccessCookie(response, newAccessToken);

    return response;
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("error rotating refresh token", e);
    return serverErrorResponse();
  } finally {
    client.release();
  }
}

function unauthorizedResponse() {
  return NextResponse.json(
    { response: "Session is over, Sign in again" },
    { status: 401 },
  );
}
// The session can't be recovered (revoked, expired, user gone): drop the
// cookies too. Otherwise /auth, which sends anyone with an auth cookie to
// the dashboard, and the dashboard, which sends anyone it can't refresh to
// /auth, bounce the browser between them.
function sessionOverResponse() {
  const response = unauthorizedResponse();
  clearAuthCookies(response);
  return response;
}
function serverErrorResponse() {
  return NextResponse.json({ response: "DB error" }, { status: 500 });
}
