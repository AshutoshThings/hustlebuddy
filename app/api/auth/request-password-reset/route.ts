import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { generateOTP, sendPasswordResetEmail } from "@/app/lib/emailService";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { response: "Email is required" },
        { status: 400 },
      );
    }

    const userResult = await pool.query(
      "SELECT id, name FROM users WHERE email = $1",
      [email],
    );
    const user = userResult.rows[0];

    // For security, don't reveal if the email exists or not, but if they exist, send the OTP
    if (user) {
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await pool.query(
        "UPDATE users SET otp = $1, otp_expiry = $2 WHERE email = $3",
        [otp, otpExpiry, email],
      );

      await sendPasswordResetEmail(email, user.name || "User", otp);
    }

    return NextResponse.json(
      {
        response: "If an account with that email exists, an OTP has been sent.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { response: "Internal server error" },
      { status: 500 },
    );
  }
}
