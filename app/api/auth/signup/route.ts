import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { hashPassword } from "@/app/lib/auth";
import { signupSchema } from "@/app/lib/validationSchema";

export async function POST(request: Request) {
  const body = await request.json();

  //1. Validate the request body against the schema
  const validationResult = signupSchema.safeParse(body);
  if (!validationResult.success) {
    console.log("Validation errors:", validationResult.error);
    return NextResponse.json(
      { response: "Invalid input - zod validation failed!" },
      { status: 400 },
    );
  }

  //2. If validation passes, proceed with the signup logic
  const { name, email, password } = validationResult.data;
  const hashedPassword = await hashPassword(password);
  try {
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [name, email, hashedPassword],
    );
    const userId = result.rows[0].id;
    console.log("User created with ID:", userId);
    return NextResponse.json(
      { response: "user created successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error creating user:", error);

    //change this
    const existingUser = await pool.query(
      "SELECT email FROM users where email = $1",
      [email],
    );
    if (existingUser.rows[0].email) {
      //the user already exists
      return NextResponse.json(
        { response: "the email already exists" },
        { status: 201 },
      );
    }
    //till here

    return NextResponse.json(
      { response: "Inter server error creating user" },
      { status: 500 },
    );
  } finally {
    console.log("Signup route completed");
  }
}
