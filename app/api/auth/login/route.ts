import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { verifyPassword, DUMMY_HASH } from "@/app/lib/auth";
import {
  issueSession,
  setAccessCookie,
  setRefreshCookie,
} from "@/app/lib/authCookies";
import { loginSchema } from "@/app/lib/validationSchema";
import { rateLimit, clientIp, MINUTE } from "@/app/lib/rateLimit";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.log(e);
    return NextResponse.json({ response: "Empty body" }, { status: 400 });
  }

  const ip = clientIp(request);
  const limited = await rateLimit(
    [
      { name: "login:ip", id: ip, limit: 30, windowSeconds: 15 * MINUTE },
      {
        name: "login:ip-email",
        id: `${ip}:${String(body?.email ?? "")
          .trim()
          .toLowerCase()}`,
        limit: 10,
        windowSeconds: 15 * MINUTE,
      },
    ],
    "Too many login attempts. Please wait a few minutes and try again.",
  );
  if (limited) return limited;

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

    if (!user.is_verified) {
      console.log("Login blocked: unverified user", user.id);
      return NextResponse.json(
        { response: "Please verify your email before logging in" },
        { status: 403 },
      );
    }

    const { accessToken, refreshToken } = await issueSession(user.id);

    console.log("User logged in successfully: ", user.id);
    const response = NextResponse.json({ accessToken }, { status: 200 });

    setRefreshCookie(response, refreshToken);
    setAccessCookie(response, accessToken);

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
