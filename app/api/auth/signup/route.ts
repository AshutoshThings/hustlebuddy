import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { hashPassword } from "@/app/lib/auth";
import { signupSchema } from "@/app/lib/validationSchema";
import { Resend } from "resend";

export async function POST(request: Request) {
  const body = await request.json();
  const resend = new Resend(process.env.RESEND_API_KEY);

  //1. Validate the request body against the schema
  const validationResult = signupSchema.safeParse(body);
  if (!validationResult.success) {
    console.log("Validation errors:", validationResult.error);
    return NextResponse.json(
      { response: validationResult.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  //2. If validation passes, proceed with the signup logic
  const { name, email, password } = validationResult.data;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const hashedPassword = await hashPassword(password);
  try {
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, otp, otp_expiry, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email",
      [name, email, hashedPassword, otp, otpExpiry, false],
    );

    await resend.emails.send({
      from: "HustleBuddy <onboarding@resend.dev>",
      to: email,
      subject: "Verify your HustleBuddy Account",
      html: `
        <div style="font-family: sans-serif; text-align: center;">
          <h2>Welcome to HustleBuddy, ${name}!</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 5px; color: #000; background: #f4f4f4; padding: 12px; border-radius: 8px;">
            ${otp}
          </h1>
          <p>This code expires in 10 minutes.</p>
        </div>`,
    });
    const userId = result.rows[0].id;
    console.log("OTP sent successfully:", userId);
    return NextResponse.json(
      { response: "OTP sent successfully", requiresOTP: true },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error creating user:", error);

    //change this
    const existingUser = await pool.query(
      "SELECT email, is_verified FROM users where email = $1",
      [email],
    );
    if (
      existingUser.rows[0].email &&
      existingUser.rows[0].is_verified == true
    ) {
      //the user already exists
      return NextResponse.json(
        { response: "the email already exists" },
        { status: 201 },
      );
    }
    //till here

    return NextResponse.json(
      { response: "Internal server error creating user" },
      { status: 500 },
    );
  } finally {
    console.log("Signup route completed");
  }
}
