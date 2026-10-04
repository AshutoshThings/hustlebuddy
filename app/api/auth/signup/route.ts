import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { hashPassword } from "@/app/lib/auth";
import { signupSchema } from "@/app/lib/validationSchema";
import { generateOTP, sendVerificationEmail } from "@/app/lib/emailService";

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
      "SELECT id, is_verified FROM users WHERE email = $1",
      [email],
    );
    const existingUser = existingUserResult.rows[0];

    if (existingUser && existingUser.is_verified) {
      return NextResponse.json(
        { response: "the email already exists" },
        { status: 400 },
      );
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashedPassword = await hashPassword(password);

    if (existingUser && !existingUser.is_verified) {
      await pool.query(
        "UPDATE users SET name = $1, password_hash = $2, otp = $3, otp_expiry = $4 WHERE email = $5",
        [name, hashedPassword, otp, otpExpiry, email],
      );
    } else {
      await pool.query(
        "INSERT INTO users (name, email, password_hash, otp, otp_expiry, is_verified) VALUES ($1, $2, $3, $4, $5, $6)",
        [name, email, hashedPassword, otp, otpExpiry, false],
      );
    }

    // Send email using modular service
    await sendVerificationEmail(email, name, otp);

    return NextResponse.json(
      { response: "OTP sent successfully", requiresOTP: true },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Database or Email Error:", error);
    return NextResponse.json(
      { response: "Internal server error creating user" },
      { status: 500 },
    );
  }
}
