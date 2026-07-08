import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, 10);
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

export async function signRefreshToken(userId: number): Promise<string> {
  const refreshToken = await jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: "30d",
    },
  );
  return refreshToken;
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<{ userId: number } | null> {
  try {
    const decoded = await jwt.verify(token, secret);
    return decoded as { userId: number };
  } catch (error) {
    console.log("Token verification failed:", error);
    return null;
  }
}
