import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

export const SALT_ROUNDS = 10;
export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  return hash;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const isValid = await bcrypt.compare(password, hash);
  return isValid;
}

export async function signAccessToken(userId: number): Promise<string> {
  const accessToken = await jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
  return accessToken;
}

// Each refresh token gets a random ID (jwtid). Without one, two tokens for
// the same user issued in the same second were identical, so a rotation
// could hand back the token it had just revoked and separate logins shared
// one session row.
export async function signRefreshToken(userId: number): Promise<string> {
  const refreshToken = await jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: "30d",
      jwtid: randomUUID(),
    },
  );
  return refreshToken;
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<{ userId: number; exp?: number } | null> {
  try {
    const decoded = await jwt.verify(token, secret);
    return decoded as { userId: number; exp?: number };
  } catch {
    // Expired or invalid tokens are routine (every 15 minutes per session).
    return null;
  }
}
