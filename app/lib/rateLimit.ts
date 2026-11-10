import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import pool from "./db";

type Rule = {
  // Bucket name, e.g. "login:ip". Combined with the identifier to form the key.
  name: string;
  // Identifier inside the bucket (IP, email, ...). Skipped when empty.
  id: string | null | undefined;
  limit: number;
  windowSeconds: number;
};

// Postgres-backed so limits hold across server instances and restarts.
// One atomic upsert per rule: the counter resets when its window has passed.
async function hit(rule: Rule): Promise<{ count: number; retryAfter: number }> {
  const key = createHash("sha256")
    .update(`${rule.name}:${rule.id}`)
    .digest("hex");
  const result = await pool.query(
    `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, now(), 1)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start <= now() - make_interval(secs => $2)
                    THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE WHEN rate_limits.window_start <= now() - make_interval(secs => $2)
                    THEN now() ELSE rate_limits.window_start END
     RETURNING count,
       ceil(extract(epoch FROM rate_limits.window_start + make_interval(secs => $2) - now()))::int AS retry_after`,
    [key, rule.windowSeconds],
  );
  return {
    count: result.rows[0].count,
    retryAfter: Math.max(1, result.rows[0].retry_after),
  };
}

function pruneSometimes() {
  if (Math.random() > 0.01) return;
  pool
    .query(
      "DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'",
    )
    .catch((e) => console.error("rate_limits prune failed", e));
}

/**
 * Counts this request against every rule. Returns a 429 response if any rule
 * is over its limit, otherwise null. If the database is unreachable it fails
 * open (logs and allows), since the route itself will then fail anyway.
 */
export async function rateLimit(
  rules: Rule[],
  message = "Too many requests. Please try again later.",
): Promise<NextResponse | null> {
  const active = rules.filter((r) => r.id);
  try {
    const results = await Promise.all(active.map(hit));
    pruneSometimes();
    const blocked = results
      .map((r, i) => ({ ...r, limit: active[i].limit }))
      .filter((r) => r.count > r.limit);
    if (!blocked.length) return null;

    const retryAfter = Math.max(...blocked.map((b) => b.retryAfter));
    return NextResponse.json(
      { response: message },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  } catch (e) {
    console.error("Rate limit check failed; allowing request", e);
    return null;
  }
}

// Best-effort client IP. Behind a proxy/CDN (Vercel, Cloudflare, nginx) the
// first X-Forwarded-For entry is the client; make sure your host overwrites
// that header rather than passing a client-supplied one through.
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
