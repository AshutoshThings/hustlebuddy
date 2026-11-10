import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashPassword, verifyToken } from "@/app/lib/auth";
import { hashToken } from "@/app/lib/authCookies";
import { checkOtp, OTP_ERROR_MESSAGES } from "@/app/lib/otp";
import { passwordSchema } from "@/app/lib/validationSchema";
import { rateLimit, clientIp, MINUTE } from "@/app/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const limited = await rateLimit([
      {
        name: "reset:ip",
        id: clientIp(request),
        limit: 30,
        windowSeconds: 15 * MINUTE,
      },
    ]);
    if (limited) return limited;

    const { email: rawEmail, otp, newPassword } = await request.json();
    const email = String(rawEmail ?? "")
      .trim()
      .toLowerCase();
    const trimmedOtp = String(otp ?? "").trim();

    if (!email || !trimmedOtp || !newPassword) {
      return NextResponse.json(
        { response: "Email, OTP, and new password are required" },
        { status: 400 },
      );
    }

    const passwordValidation = passwordSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      return NextResponse.json(
        { response: passwordValidation.error.issues[0].message },
        { status: 400 },
      );
    }

    const check = await checkOtp(email, trimmedOtp, "reset");
    if (check.status !== "ok") {
      return NextResponse.json(
        { response: OTP_ERROR_MESSAGES[check.status] },
        { status: 400 },
      );
    }
    const userId = check.userId;

    const hashedPassword = await hashPassword(newPassword);

    // Keep the session making this request (changing the password from
    // Settings), if it belongs to this user; sign out every other session.
    const currentRefresh = (await cookies()).get("refreshToken")?.value;
    const currentPayload = currentRefresh
      ? await verifyToken(currentRefresh, process.env.JWT_REFRESH_SECRET!)
      : null;
    const keepHash =
      currentRefresh && currentPayload?.userId === userId
        ? hashToken(currentRefresh)
        : null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE users SET password_hash = $1, otp = NULL, otp_expiry = NULL,
           otp_purpose = NULL, otp_attempts = 0
         WHERE id = $2`,
        [hashedPassword, userId],
      );
      await client.query(
        `UPDATE refresh_tokens SET revoked = true
         WHERE user_id = $1 AND revoked = false
           AND ($2::text IS NULL OR token_hash <> $2)`,
        [userId, keepHash],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json(
      { response: "Password updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { response: "Internal server error" },
      { status: 500 },
    );
  }
}
