import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { signRefreshToken, signAccessToken, verifyToken } from "@/app/lib/auth";
import { createHash } from "crypto";
import pool from "@/app/lib/db";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return unauthorizedResponse();
  }

  const jwtVerificationResult = await verifyToken(
    refreshToken,
    process.env.JWT_REFRESH_SECRET!,
  );

  if (!jwtVerificationResult) {
    return unauthorizedResponse();
  }

  const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
  const result = await pool.query(
    "SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > now()",
    [tokenHash],
  );

  if (result.rows.length === 0) {
    return unauthorizedResponse();
  }

  const userId = result.rows[0].user_id;
  const newAccessToken = await signAccessToken(userId);
  const newRefreshToken = await signRefreshToken(userId);
  const hashedNewRefreshToken = createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const client = await pool.connect();
  try {
    client.query("BEGIN");
    client.query(
      "UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1",
      [tokenHash],
    );
    client.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [userId, hashedNewRefreshToken, expiresAt],
    );
    client.query("COMMIT");
  } catch (e) {
    client.query("ROLLBACK");
    console.log("error rotating refresh token", e);
    return serverErrorResponse();
  } finally {
    client.release();
  }

  // set the new refresh token in the cookie
  const response = NextResponse.json(
    { accessToken: newAccessToken },
    { status: 200 },
  );
  response.cookies.set("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}

function unauthorizedResponse() {
  return NextResponse.json(
    { response: "Session is over, Sign in again" },
    { status: 401 },
  );
}
function serverErrorResponse() {
  return NextResponse.json({ response: "DB error" }, { status: 500 });
}
