import pool from "./db";
// Shared helpers for the applications API routes.

// Postgres unique_violation on the active-application index (migration 014).
export function isDuplicateError(e: unknown) {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "23505" &&
    (e as { constraint?: string }).constraint === "uniq_active_application"
  );
}

export function firstIssue(error: {
  issues: { path: PropertyKey[]; message: string }[];
}) {
  const issue = error.issues[0];
  return issue
    ? `${issue.path.map(String).join(".") || "body"}: ${issue.message}`
    : "invalid input";
}

// resume_id has a foreign key, but that only proves the resume exists, not
// that it is this user's.
export async function ownsResume(
  userId: number | string,
  resumeId: number | null | undefined,
): Promise<boolean> {
  if (resumeId == null) return true;
  const { rows } = await pool.query(
    "SELECT 1 FROM resumes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
    [resumeId, userId],
  );
  return rows.length > 0;
}
