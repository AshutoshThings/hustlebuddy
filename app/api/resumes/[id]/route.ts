import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { NextResponse } from "next/server";
import { storage, storagePathOf } from "@/app/lib/resumeStorage";

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

  if (!Number.isInteger(resumeId) || resumeId <= 0) {
    return NextResponse.json(
      { response: "Invalid resume ID" },
      { status: 400 },
    );
  }

  try {
    const findQuery = await pool.query(
      "SELECT file_path FROM resumes WHERE id = $1 AND user_id = $2",
      [resumeId, userId],
    );

    if (findQuery.rows.length === 0) {
      return NextResponse.json(
        { response: "Resume not found" },
        { status: 404 },
      );
    }

    const storagePath = storagePathOf(findQuery.rows[0].file_path);
    if (storagePath) {
      const { error } = await storage().remove([storagePath]);
      if (error) {
        console.error("Failed to delete resume file", resumeId, error);
        return NextResponse.json(
          { response: "Failed to delete resume" },
          { status: 500 },
        );
      }
    }

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
