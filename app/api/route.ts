import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(request: Request) {
  console.log(
    "Env variables : ",
    process.env.DATABASE_URL,
    process.env.JWT_SECRET,
    process.env.JWT_REFRESH_SECRET,
  );
  const client = await pool.query("select * from users");
  if (!client) {
    console.error("Failed to connect to the database");
  } else {
    console.log("Database connection successful. Users:", client.rows);
  }
  return NextResponse.json({ response: "Hello from the API route!" });
}
