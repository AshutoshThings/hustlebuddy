import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { response: "Logged out successfully" },
    { status: 200 },
  );

  // Clear the refresh token cookie by expiring it immediately
  response.cookies.set({
    name: "refreshToken",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0, // <--- Destroys the cookie
  });

  return response;
}
