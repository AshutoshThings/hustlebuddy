import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/app/lib/emailService";
import {
  generateOTP,
  isInResendCooldown,
  otpExpiryFromNow,
} from "@/app/lib/otp";
import { rateLimit, clientIp, HOUR } from "@/app/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const { email: rawEmail } = await request.json();
    const email = String(rawEmail ?? "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        { response: "Email is required" },
        { status: 400 },
      );
    }

    // Per-email cap stops someone flooding a victim's inbox with codes.
    const limited = await rateLimit(
      [
        {
          name: "reset-request:ip",
          id: clientIp(request),
          limit: 10,
          windowSeconds: HOUR,
        },
        {
          name: "reset-request:email",
          id: email,
          limit: 5,
          windowSeconds: HOUR,
        },
      ],
      "Too many reset requests. Please try again later.",
    );
    if (limited) return limited;

    const userResult = await pool.query(
      "SELECT id, name, otp_expiry, otp_purpose FROM users WHERE email = $1",
      [email],
    );
    const user = userResult.rows[0];

    // Don't reveal whether the email exists. Within the cooldown we quietly
    // skip sending, so the previous code stays valid.
    const inCooldown =
      user?.otp_purpose === "reset" && isInResendCooldown(user.otp_expiry);

    if (user && !inCooldown) {
      const otp = generateOTP();
      await pool.query(
        `UPDATE users SET otp = $1, otp_expiry = $2, otp_purpose = 'reset', otp_attempts = 0
         WHERE id = $3`,
        [otp, otpExpiryFromNow(), user.id],
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
