import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json(
      { response: "session expired, login again" },
      { status: 401 },
    );
  }

  const { userId } = auth;
  const resumeId = Number((await params).id);

  if (Number.isNaN(resumeId)) {
    return NextResponse.json(
      { response: "Invalid resume ID" },
      { status: 400 },
    );
  }

  try {
    // 1. Fetch resume to get the file path/URL and secure user ownership
    const findQuery = await pool.query(
      "SELECT * FROM resumes WHERE id = $1 AND user_id = $2",
      [resumeId, userId],
    );

    if (findQuery.rows.length === 0) {
      return NextResponse.json(
        { response: "Resume not found" },
        { status: 404 },
      );
    }

    const resume = findQuery.rows.length > 0 ? findQuery.rows[0] : null;

    // 2. Extract relative storage path from public URL to delete from bucket if needed
    // URL structure: .../storage/v1/object/public/resumes/userId/filename
    if (resume && resume.file_path) {
      const urlParts = resume.file_path.split("/resumes/");
      if (urlParts.length > 1) {
        const storagePath = urlParts[1];
        await supabase.storage.from("resumes").remove([storagePath]);
      }
    }

    // 3. HARD DELETE from PostgreSQL database
    await pool.query("DELETE FROM resumes WHERE id = $1 AND user_id = $2", [
      resumeId,
      userId,
    ]);

    return NextResponse.json(
      { response: "Resume deleted successfully" },
      { status: 200 },
    );
  } catch (e) {
    console.error("Hard delete failed for resume", resumeId, e);
    return NextResponse.json(
      { response: "Failed to delete resume" },
      { status: 500 },
    );
  }
}
