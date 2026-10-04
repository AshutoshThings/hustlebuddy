import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { hashPassword } from "@/app/lib/auth";
import { signupSchema } from "@/app/lib/validationSchema"; // <--- Import signupSchema

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { response: "Email, OTP, and new password are required" },
        { status: 400 },
      );
    }

    // 1. Enforce strict password rules using Zod server-side
    const passwordValidation =
      signupSchema.shape.password.safeParse(newPassword);
    if (!passwordValidation.success) {
      return NextResponse.json(
        { response: passwordValidation.error.issues[0].message },
        { status: 400 },
      );
    }

    // 2. Fetch user and verify OTP
    const userResult = await pool.query(
      "SELECT id, otp, otp_expiry FROM users WHERE email = $1",
      [email],
    );
    const user = userResult.rows[0];

    if (!user || !user.otp || user.otp !== otp) {
      return NextResponse.json(
        { response: "Invalid OTP code" },
        { status: 400 },
      );
    }

    if (new Date() > new Date(user.otp_expiry)) {
      return NextResponse.json(
        { response: "OTP has expired" },
        { status: 400 },
      );
    }

    // 3. Hash new password and update database
    const hashedPassword = await hashPassword(newPassword);

    await pool.query(
      "UPDATE users SET password_hash = $1, otp = NULL, otp_expiry = NULL WHERE email = $2",
      [hashedPassword, email],
    );

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
