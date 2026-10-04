import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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
    return NextResponse.json({ resumes: userResumes.rows });
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
    const file = formData.get("file") as File;
    const roleTargeted = (formData.get("role_targeted") as string) || "General";
    const notes = (formData.get("notes") as string) || "";

    if (!file) {
      return NextResponse.json(
        { response: "No file uploaded" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = file.name.replace(/\s+/g, "_");
    const filePath = `${userId}/${uniqueSuffix}-${sanitizedFileName}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from("resumes")
      .upload(filePath, buffer, {
        contentType: file.type || "application/pdf",
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json(
        { response: storageError.message },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(storageData.path);

    const insertResponse = await pool.query(
      `INSERT INTO resumes (user_id, file_name, file_path, role_targeted, notes, parsed_text, extracted_keywords) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        file.name,
        publicUrlData.publicUrl,
        roleTargeted,
        notes,
        "Parsed text placeholder",
        JSON.stringify(["JavaScript", "TypeScript", "React", "Node.js"]),
      ],
    );

    return NextResponse.json(
      { resume: insertResponse.rows[0] },
      { status: 201 },
    );
  } catch (e) {
    console.error("Error uploading resume", e);
    return NextResponse.json(
      { response: "Failed to upload resume" },
      { status: 500 },
    );
  }
}
