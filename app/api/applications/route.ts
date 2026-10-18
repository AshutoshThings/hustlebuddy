import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { NextResponse } from "next/server";
import { applicationSchema } from "@/app/lib/validationSchema";
import { broadcastNewApplication } from "./stream/route";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json(
      { response: "session expired, login again" },
      { status: 401, headers: corsHeaders() },
    );
  }
  const { userId } = auth;
  try {
    const userApplications = await pool.query(
      "SELECT * FROM applications where user_id = $1 AND deleted_at IS NULL",
      [userId],
    );

    return NextResponse.json(
      {
        applications: userApplications.rows,
      },
      { headers: corsHeaders() },
    );
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      { response: "Internal server error" },
      { status: 500, headers: corsHeaders() },
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
      { status: 401, headers: corsHeaders() },
    );
  }
  const { userId } = auth;
  if (!userId) {
    console.log("invalid user tried to access the /api/applications/ route");
    return NextResponse.json(
      {
        response: "session expired",
      },
      { status: 401, headers: corsHeaders() },
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
        { status: 400, headers: corsHeaders() },
      );
    }

    const {
      company: cleanCompany,
      role: cleanRole,
      status: cleanStatus,
      source: cleanSource,
      notes: cleanNotes,
    } = validatedBody.data;

    // 1. CHECK FOR DUPLICATES: See if the user already has this exact role at this company
    const existingCheck = await pool.query(
      `SELECT id FROM applications 
       WHERE user_id = $1 
         AND LOWER(company) = LOWER($2) 
         AND LOWER(role) = LOWER($3) 
         AND deleted_at IS NULL`,
      [userId, cleanCompany.trim(), cleanRole.trim()],
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          response: "Application already exists in your tracker!",
          duplicate: true,
        },
        { status: 200, headers: corsHeaders() },
      );
    }

    // 2. INSERT IF NOT A DUPLICATE
    const insertResponse = await pool.query(
      "INSERT into applications (user_id, company, role, status, source, notes) values ($1, $2, $3, $4, $5, $6) RETURNING * ",
      [userId, cleanCompany, cleanRole, cleanStatus, cleanSource, cleanNotes],
    );
    const newApp = insertResponse.rows[0];
    broadcastNewApplication(userId, newApp);

    return NextResponse.json(
      { application: newApp, duplicate: false },
      { status: 201, headers: corsHeaders() },
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
      { status: 500, headers: corsHeaders() },
    );
  }
}
