import { randomInt, timingSafeEqual } from "node:crypto";
import pool from "./db";

export type OtpPurpose = "verify" | "reset";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export function generateOTP(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function otpExpiryFromNow(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

// A code was issued less than a minute ago (expiry is always issue time + TTL).
export function isInResendCooldown(otpExpiry: Date | string | null): boolean {
  if (!otpExpiry) return false;
  const issuedAt = new Date(otpExpiry).getTime() - OTP_TTL_MS;
  return Date.now() - issuedAt < OTP_RESEND_COOLDOWN_MS;
}

function codesMatch(stored: string, given: string): boolean {
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type OtpCheck =
  | { status: "ok"; userId: number }
  | { status: "invalid" | "expired" | "locked" };

/**
 * Checks a code for the given purpose. Every call spends one attempt, and the
 * attempt is counted atomically *before* comparing, so parallel guesses can't
 * get around the limit. After OTP_MAX_ATTEMPTS the code is wiped.
 * On "ok" the caller must clear the code as part of its own update.
 */
export async function checkOtp(
  email: string,
  given: string,
  purpose: OtpPurpose,
): Promise<OtpCheck> {
  const result = await pool.query(
    `UPDATE users SET otp_attempts = otp_attempts + 1
     WHERE email = $1 AND otp IS NOT NULL AND otp_purpose = $2
     RETURNING id, otp, otp_expiry, otp_attempts`,
    [email, purpose],
  );
  const row = result.rows[0];
  if (!row) return { status: "invalid" };

  if (row.otp_attempts > OTP_MAX_ATTEMPTS) {
    await clearOtp(row.id);
    return { status: "locked" };
  }
  if (Date.now() > new Date(row.otp_expiry).getTime()) {
    await clearOtp(row.id);
    return { status: "expired" };
  }
  if (!codesMatch(row.otp, given)) {
    if (row.otp_attempts >= OTP_MAX_ATTEMPTS) {
      await clearOtp(row.id);
      return { status: "locked" };
    }
    return { status: "invalid" };
  }
  return { status: "ok", userId: row.id };
}

async function clearOtp(userId: number) {
  await pool.query(
    "UPDATE users SET otp = NULL, otp_expiry = NULL, otp_purpose = NULL, otp_attempts = 0 WHERE id = $1",
    [userId],
  );
}

export const OTP_ERROR_MESSAGES: Record<
  Exclude<OtpCheck["status"], "ok">,
  string
> = {
  invalid: "Invalid or expired code",
  expired: "This code has expired. Request a new one.",
  locked: "Too many incorrect attempts. Request a new code.",
};
