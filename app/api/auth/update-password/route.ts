import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { hashPassword } from "@/app/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json(
      { response: "Session expired, login again" },
      { status: 401 },
    );
  }

  const { userId } = auth;

  try {
    const body = await request.json();
    const { otp, newPassword } = body;

    if (!otp || !newPassword) {
      return NextResponse.json(
        { response: "OTP and new password are required" },
        { status: 400 },
      );
    }

    // Fetch stored OTP and expiry
    const userResult = await pool.query(
      "SELECT otp, otp_expiry FROM users WHERE id = $1",
      [userId],
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

    // Hash new password and clear OTP fields
    const hashedPassword = await hashPassword(newPassword);
    await pool.query(
      "UPDATE users SET password_hash = $1, otp = NULL, otp_expiry = NULL WHERE id = $2",
      [hashedPassword, userId],
    );

    return NextResponse.json(
      { response: "Password updated successfully" },
      { status: 200 },
    );
  } catch (e) {
    console.error("Error updating password:", e);
    return NextResponse.json(
      { response: "Internal server error" },
      { status: 500 },
    );
  }
}
