import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/getAuthUser";
import { applicationOnUpdate } from "@/app/lib/validationSchema";
import { NextResponse } from "next/server";

export async function PATCH(
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
  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.log("Empty body on application edit request", e);
    return NextResponse.json({ response: "Empty body" }, { status: 400 });
  }

  const zodVerification = applicationOnUpdate.safeParse(body);
  const { userId } = auth;
  const paramsId = Number((await params).id);
  if (Number.isNaN(paramsId) || paramsId <= 0) {
    // invalid paramsId
    return NextResponse.json(
      {
        response: "invalid params",
      },
      { status: 400 },
    );
  }
  if (!zodVerification.success) {
    return NextResponse.json(
      { response: "atleast 1 value is required" },
      { status: 400 },
    );
  }
  const entries = Object.entries(zodVerification.data);
  const setClauses = entries.map(([key], index) => `${key} = $${index + 1}`);
  const values = entries.map(([, value]) => value);
  setClauses.push("updated_at = now()");

  const query = `UPDATE applications SET ${setClauses.join(", ")} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2} RETURNING *`;

  try {
    const queryResult = await pool.query(query, [...values, paramsId, userId]);
    if (queryResult.rows.length === 0) {
      return NextResponse.json(
        {
          response: "application not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { application: queryResult.rows[0] },
      { status: 200 },
    );
  } catch (e) {
    console.error("Error updating application", userId, paramsId, e);
    return NextResponse.json(
      { response: "failed to update application" },
      { status: 500 },
    );
  }
}
