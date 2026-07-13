import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { NextResponse } from "next/server";
import { applicationSchema } from "@/app/lib/validationSchema";

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
    const userApplications = await pool.query(
      "SELECT * FROM applications where user_id = $1",
      [userId],
    );

    return NextResponse.json({
      applications: userApplications.rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      { response: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json(
      {
        response: "Session expired. Please log in again.",
      },
      { status: 401 },
    );
  }
  const { userId } = auth;
  if (!userId) {
    console.log("invalid user tried to access the /api/applications/ route");
    return NextResponse.json(
      {
        response: "session expired",
      },
      { status: 401 },
    );
  }
  try {
    const body = await request.json();
    const { company, role, status, source, notes } = body;

    // validate values with zod.
    const validatedBody = applicationSchema.safeParse({
      company,
      role,
      status,
      source,
      notes,
    });
    if (!validatedBody.success) {
      //zod validation failed.
      return NextResponse.json(
        {
          response: "required all valid values",
        },
        { status: 400 },
      );
    }
    const insertResponse = await pool.query(
      "INSERT into applications (user_id, company, role, status, source, notes) values ($1, $2, $3, $4, $5, $6) RETURNING * ",
      [
        userId,
        validatedBody.data.company,
        validatedBody.data.role,
        validatedBody.data.status,
        validatedBody.data.source,
        validatedBody.data.notes,
      ],
    );
    return NextResponse.json(
      { application: insertResponse.rows[0] },
      { status: 201 },
    );
  } catch (e) {
    console.error(
      "Error occurred while inserting application data by user",
      userId,
      e,
    );
    return NextResponse.json(
      {
        response: "application failed to save successfuly",
      },
      { status: 500 },
    );
  }
}
