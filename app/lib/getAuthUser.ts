import { verifyToken } from "./auth";
import { cookies } from "next/headers";

export async function getAuthUser(
  request: Request,
): Promise<{ userId: number | string } | null> {
  let token: string | undefined;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("accessToken")?.value;
  }

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token, process.env.JWT_SECRET!);
  if (!payload) {
    return null;
  }
  return { userId: payload.userId };
}
