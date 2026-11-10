import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { hashPassword } from "@/app/lib/auth";
import { signupSchema } from "@/app/lib/validationSchema";
import { sendVerificationEmail } from "@/app/lib/emailService";
import {
  generateOTP,
  isInResendCooldown,
  otpExpiryFromNow,
} from "@/app/lib/otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { response: validationResult.error.issues.map((i) => i.message) },
        { status: 400 },
      );
    }

    const { name, email, password } = validationResult.data;

    // Check existing user
    const existingUserResult = await pool.query(
      "SELECT id, is_verified, otp_expiry, otp_purpose FROM users WHERE email = $1",
      [email],
    );
    const existingUser = existingUserResult.rows[0];

    if (existingUser && existingUser.is_verified) {
      return NextResponse.json(
        { response: "the email already exists" },
        { status: 400 },
      );
    }

    if (
      existingUser &&
      existingUser.otp_purpose === "verify" &&
      isInResendCooldown(existingUser.otp_expiry)
    ) {
      return NextResponse.json(
        { response: "Please wait a minute before requesting another code." },
        { status: 429 },
      );
    }

    const otp = generateOTP();
    const otpExpiry = otpExpiryFromNow();
    const hashedPassword = await hashPassword(password);

    // An unverified row can be re-claimed by signing up again. That is safe
    // because /verify requires this same password together with the emailed
    // code, so only someone who controls the inbox *and* chose the password
    // can activate the account.
    if (existingUser) {
      await pool.query(
        `UPDATE users SET name = $1, password_hash = $2, otp = $3, otp_expiry = $4,
           otp_purpose = 'verify', otp_attempts = 0
         WHERE email = $5 AND is_verified = false`,
        [name, hashedPassword, otp, otpExpiry, email],
      );
    } else {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, otp, otp_expiry, otp_purpose, otp_attempts, is_verified)
         VALUES ($1, $2, $3, $4, $5, 'verify', 0, false)`,
        [name, email, hashedPassword, otp, otpExpiry],
      );
    }

    await sendVerificationEmail(email, name, otp);

    return NextResponse.json(
      { response: "OTP sent successfully", requiresOTP: true },
      { status: 200 },
    );
  } catch (error) {
    console.error("Database or Email Error:", error);
    return NextResponse.json(
      { response: "Internal server error creating user" },
      { status: 500 },
    );
  }
}
