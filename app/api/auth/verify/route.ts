import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { verifyPassword } from "@/app/lib/auth";
import { checkOtp, OTP_ERROR_MESSAGES } from "@/app/lib/otp";

export async function POST(request: Request) {
  try {
    const { email: rawEmail, otp, password } = await request.json();
    const email = String(rawEmail ?? "").trim().toLowerCase();
    const trimmedOtp = String(otp ?? "").trim();

    if (!email || !trimmedOtp || typeof password !== "string" || !password) {
      return NextResponse.json(
        { response: ["Email, code, and password are required"] },
        { status: 400 },
      );
    }

    const check = await checkOtp(email, trimmedOtp, "verify");
    if (check.status !== "ok") {
      return NextResponse.json(
        { response: [OTP_ERROR_MESSAGES[check.status]] },
        { status: 400 },
      );
    }

    // The code proves inbox access; the password proves this is the same
    // person who signed up (see /api/auth/signup).
    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [check.userId],
    );
    const passwordOk =
      userResult.rows[0] &&
      (await verifyPassword(password, userResult.rows[0].password_hash));
    if (!passwordOk) {
      return NextResponse.json(
        { response: ["Invalid or expired code"] },
        { status: 400 },
      );
    }

    await pool.query(
      `UPDATE users SET is_verified = TRUE, otp = NULL, otp_expiry = NULL,
         otp_purpose = NULL, otp_attempts = 0
       WHERE id = $1`,
      [check.userId],
    );

    return NextResponse.json(
      { response: "Account verified successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { response: ["Internal server error"] },
      { status: 500 },
    );
  }
}
