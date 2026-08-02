import { NextResponse } from "next/server";

import pool from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();
    const { rows } = await pool.query(
      `SELECT id, otp, otp_expiry FROM users WHERE email = $1`,
      [email],
    );
    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { response: ["User not found"] },
        { status: 404 },
      );
    }

    if (user.otp !== otp) {
      return NextResponse.json(
        { response: ["Invalid verification code"] },
        { status: 400 },
      );
    }
    if (new Date() > new Date(user.otp_expiry)) {
      return NextResponse.json(
        { response: ["Verification code has expired"] },
        { status: 400 },
      );
    }

    await pool.query(
      `
        UPDATE users 
        SET is_verified = TRUE, otp = NULL, otp_expiry = NULL 
        WHERE email = $1
        `,
      [email],
    );

    return NextResponse.json(
      {
        response: "Verified successfully",
        token: "your_access_token_here",
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { response: ["Internal Server Error"] },
      { status: 500 },
    );
  }
}
