import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { response: "Logged out successfully" },
    { status: 200 },
  );

  response.cookies.set({
    name: "refreshToken",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: "accessToken",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
