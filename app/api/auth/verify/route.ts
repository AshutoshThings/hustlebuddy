import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    // 1. Fetch user by email
    const userResult = await pool.query(
      "SELECT id, otp, otp_expiry, is_verified FROM users WHERE email = $1",
      [email],
    );
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json(
        { response: ["User not found"] },
        { status: 400 },
      );
    }

    // 2. Check if OTP matches and hasn't expired
    if (user.otp !== otp || new Date() > new Date(user.otp_expiry)) {
      return NextResponse.json(
        { response: ["Invalid or expired OTP"] },
        { status: 400 },
      );
    }

    // 3. Mark user as verified and clear the OTP fields
    await pool.query(
      "UPDATE users SET is_verified = TRUE, otp = NULL, otp_expiry = NULL WHERE email = $1",
      [email],
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
