import { createHash } from "crypto";
import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  DUMMY_HASH,
} from "@/app/lib/auth";
import { loginSchema } from "@/app/lib/validationSchema";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.log(e);
    return NextResponse.json({ response: "Empty body" }, { status: 400 });
  }

  const validationResult = loginSchema.safeParse(body);
  if (!validationResult.success) {
    console.log("Validation errors: ", validationResult.error);
    return NextResponse.json(
      {
        response: validationResult.error.issues
          .map((issue) => issue.message)
          .join(", "),
      },
      { status: 400 },
    );
  }

  const { email, password } = validationResult.data;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      // Same bcrypt cost as a real check, so response time doesn't reveal
      // whether the email exists.
      await verifyPassword(password, DUMMY_HASH);
      console.log("Login failed: unknown email");
      return NextResponse.json(
        { response: "Invalid email or password" },
        { status: 401 },
      );
    }
    const user = result.rows[0];

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      console.log("Login failed: wrong password for user", user.id);
      return NextResponse.json(
        { response: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Only after the password is right, so this can't be used to probe
    // which emails are registered-but-unverified.
    if (!user.is_verified) {
      // use the column your verify route actually sets
      console.log("Login blocked: unverified user", user.id);
      return NextResponse.json(
        { response: "Please verify your email before logging in" },
        { status: 403 },
      );
    }

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

    console.log("User logged in successfully: ", user.id);
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
      { response: "Error during login" },
      { status: 500 },
    );
  } finally {
    console.log("Login route completed");
  }
}
