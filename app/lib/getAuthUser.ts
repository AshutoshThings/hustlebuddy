import { verifyToken } from "./auth";

export async function getAuthUser(
  request: Request,
): Promise<{ userId: number } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  const payload = await verifyToken(token, process.env.JWT_SECRET!);
  if (!payload) {
    return null;
  }
  return { userId: payload.userId };
}
