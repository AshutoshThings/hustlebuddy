import { getAuthUser } from "@/app/lib/getAuthUser";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json(
    { authenticated: true, userId: auth.userId },
    { status: 200 },
  );
}
