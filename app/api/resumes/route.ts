import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  allowedResumeType,
  MAX_RESUME_BYTES,
  safeFileName,
  storage,
  withSignedUrls,
} from "@/app/lib/resumeStorage";

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
    const userResumes = await pool.query(
      "SELECT * FROM resumes WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC",
      [userId],
    );
    return NextResponse.json({
      resumes: await withSignedUrls(userResumes.rows),
    });
  } catch (e) {
    console.error("Error fetching resumes:", e);
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
      { response: "Session expired. Please log in again." },
      { status: 401 },
    );
  }

  const { userId } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const roleTargeted =
      String(formData.get("role_targeted") ?? "").slice(0, 200) || "General";
    const notes = String(formData.get("notes") ?? "").slice(0, 5000);

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { response: "No file uploaded" },
        { status: 400 },
      );
    }

    const contentType = allowedResumeType(file.name);
    if (!contentType) {
      return NextResponse.json(
        { response: "Only PDF files are allowed" },
        { status: 400 },
      );
    }
    if (file.size > MAX_RESUME_BYTES) {
      return NextResponse.json(
        { response: "File is too large (max 3 MB)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = `${userId}/${randomUUID()}-${safeFileName(file.name)}`;

    // contentType comes from our allowlist, never from the client, so an
    // upload can't be served back as HTML.
    const { data: storageData, error: storageError } = await storage().upload(
      filePath,
      buffer,
      { contentType, upsert: false },
    );

    if (storageError) {
      console.error("Resume storage upload failed", storageError);
      return NextResponse.json(
        { response: "Failed to upload resume" },
        { status: 500 },
      );
    }

    // Store the private path; clients get short-lived signed URLs instead.
    const insertResponse = await pool.query(
      `INSERT INTO resumes (user_id, file_name, file_path, role_targeted, notes, parsed_text, extracted_keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        file.name.slice(0, 255),
        storageData.path,
        roleTargeted,
        notes,
        "Parsed text placeholder",
        JSON.stringify(["JavaScript", "TypeScript", "React", "Node.js"]),
      ],
    );

    const [resume] = await withSignedUrls(insertResponse.rows);
    return NextResponse.json({ resume }, { status: 201 });
  } catch (e) {
    console.error("Error uploading resume", e);
    return NextResponse.json(
      { response: "Failed to upload resume" },
      { status: 500 },
    );
  }
}
