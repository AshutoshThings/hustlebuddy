import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { NextResponse } from "next/server";
import {
  firstIssue,
  isDuplicateError,
  ownsResume,
} from "@/app/lib/applicationErrors";
import { applicationSchema } from "@/app/lib/validationSchema";
import { publishApplicationCreated } from "@/app/lib/realtime";

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
  try {
    const body = await request.json();
    const { company, role, status, source, notes, resume_id } = body;

    // validate values with zod.
    const validatedBody = applicationSchema.safeParse({
      company,
      role,
      status,
      source,
      notes,
      resume_id,
    });
    if (!validatedBody.success) {
      //zod validation failed.
      return NextResponse.json(
        { response: firstIssue(validatedBody.error) },
        { status: 400, headers: corsHeaders() },
      );
    }

    const {
      company: cleanCompany,
      role: cleanRole,
      status: cleanStatus,
      source: cleanSource,
      notes: cleanNotes,
      resume_id: cleanResumeId,
    } = validatedBody.data;

    if (!(await ownsResume(userId, cleanResumeId))) {
      return NextResponse.json(
        { response: "resume_id: Resume not found" },
        { status: 400, headers: corsHeaders() },
      );
    }

    // 1. CHECK FOR DUPLICATES: See if the user already has this exact role at this company
    const existingCheck = await pool.query(
      `SELECT id FROM applications 
       WHERE user_id = $1 
         AND LOWER(company) = LOWER($2) 
         AND LOWER(role) = LOWER($3) 
         AND deleted_at IS NULL`,
      [userId, cleanCompany, cleanRole],
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
      "INSERT into applications (user_id, company, role, status, source, notes, resume_id) values ($1, $2, $3, $4, $5, $6, $7) RETURNING * ",
      [
        userId,
        cleanCompany,
        cleanRole,
        cleanStatus,
        cleanSource,
        cleanNotes,
        cleanResumeId ?? null,
      ],
    );
    const newApp = insertResponse.rows[0];
    await publishApplicationCreated(Number(userId), newApp.id);

    return NextResponse.json(
      { application: newApp, duplicate: false },
      { status: 201, headers: corsHeaders() },
    );
  } catch (e) {
    // Lost a race with a concurrent save of the same application.
    if (isDuplicateError(e)) {
      return NextResponse.json(
        {
          response: "Application already exists in your tracker!",
          duplicate: true,
        },
        { status: 200, headers: corsHeaders() },
      );
    }
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
