import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { hashPassword } from "@/app/lib/auth";
import { validationSchema } from "@/app/lib/validationSchema";

export async function POST(request: Request) {
  const body = await request.json();

  // Validate the request body against the schema
  const validationResult = validationSchema.safeParse(body);
  if (!validationResult.success) {
    console.log("Validation errors:", validationResult.error);
    return NextResponse.json(
      { response: "Invalid input - zod validation failed!" },
      { status: 400 },
    );
  }

  // If validation passes, proceed with the signup logic
  const { email, password } = validationResult.data;
  const hashedPassword = await hashPassword(password);
  try {
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword],
    );
    const userId = result.rows[0].id;
    console.log("User created with ID:", userId);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { response: "Error creating user" },
      { status: 500 },
    );
  } finally {
    console.log("Signup route completed");
  }
  return NextResponse.json({
    response: "Signup successful!",
    body: body.email,
  });
}
