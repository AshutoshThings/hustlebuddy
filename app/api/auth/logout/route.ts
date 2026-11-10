import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/app/lib/db";
import { clearAuthCookies, hashToken } from "@/app/lib/authCookies";

export async function POST() {
  const refreshToken = (await cookies()).get("refreshToken")?.value;

  // Revoke server-side too, so a copied refresh token stops working.
  if (refreshToken) {
    try {
      await pool.query(
        "UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1",
        [hashToken(refreshToken)],
      );
    } catch (e) {
      console.error("Failed to revoke refresh token on logout", e);
    }
  }

  const response = NextResponse.json(
    { response: "Logged out successfully" },
    { status: 200 },
  );
  clearAuthCookies(response);
  return response;
}
