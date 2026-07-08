import { createHash } from "crypto";
import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
} from "@/app/lib/auth";
import { validationSchema } from "@/app/lib/validationSchema";

const DUMMY_HASH =
  "$2a$08$ZUxsk3klUbOZzTBkyBW7hO7iBBCLQ5sNTCkuo8ZNHKD5k8O98tbU."; // Dummy hash for timing attack prevention
// Used when the email does not exist so bcrypt work remains constant.
// Helps reduce account enumeration via timing differences.

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.log(e);
    return NextResponse.json({ message: "Empty body" }, { status: 400 });
  }

  // Validate the request body against the schema
  const validationResult = validationSchema.safeParse(body);
  if (!validationResult.success) {
    console.log("Validation errors: ", validationResult.error);
    return NextResponse.json(
      { message: "Invalid input - zod validation failed!" },
      { status: 400 },
    );
  }

  // If validation passes, proceed with the login logic
  const { email, password } = validationResult.data;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      console.log("User not found for email: ", email);
      await verifyPassword(password, DUMMY_HASH);
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }
    const user = result.rows[0];

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      console.log("Invalid password for user: ", email);
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    // password auth success, proceed with JWT token

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);
    const hashedRefreshToken = createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, hashedRefreshToken, expiresAt],
    );

    console.log("User logged in successfully: ", email);
    const response = NextResponse.json({ accessToken }, { status: 200 });
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Error during login: ", error);
    return NextResponse.json(
      { message: "Error during login" },
      { status: 500 },
    );
  } finally {
    console.log("Login route completed");
  }
}
