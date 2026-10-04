import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json(
      { response: "session expired, login again" },
      { status: 401 },
    );
  }

  const { userId } = auth;

  try {
    // Fixed column name from created_at to create_at based on your database schema
    const userResult = await pool.query(
      "SELECT id, name, email, create_at FROM users WHERE id = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { response: "User profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      user: userResult.rows[0],
    });
  } catch (e) {
    console.error(
      "Error occurred while fetching user profile for user:",
      userId,
      e,
    );

    return NextResponse.json(
      { response: "Internal server error" },
      { status: 500 },
    );
  }
}
