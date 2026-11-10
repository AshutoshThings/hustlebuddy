import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const RESUME_BUCKET = "resumes";
// Keep in sync with the bucket settings in Supabase (3 MB, PDF only).
export const MAX_RESUME_BYTES = 3 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const ALLOWED_TYPES: Record<string, string> = {
  pdf: "application/pdf",
};

let client: SupabaseClient | null = null;

// Server-only client. It needs the service-role key: the bucket is private,
// and falling back to the public anon key would silently weaken access.
export function storage() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
      );
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client.storage.from(RESUME_BUCKET);
}

// Returns the content type to store, or null if the file isn't allowed.
export function allowedResumeType(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_TYPES[ext] ?? null;
}

export function safeFileName(fileName: string): string {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^[._]+/, "")
    .slice(-100);
  return cleaned || "resume";
}

// Rows created before the bucket went private stored a full public URL;
// newer rows store just the path inside the bucket.
export function storagePathOf(filePath: string): string | null {
  if (!filePath) return null;
  if (!/^https?:\/\//.test(filePath)) return filePath;
  const marker = `/${RESUME_BUCKET}/`;
  const idx = filePath.indexOf(marker);
  return idx === -1
    ? null
    : decodeURIComponent(filePath.slice(idx + marker.length));
}

type ResumeRow = { file_path: string } & Record<string, unknown>;

// Replaces each row's stored path with a short-lived signed `url`.
export async function withSignedUrls<T extends ResumeRow>(rows: T[]) {
  const paths = rows.map((r) => storagePathOf(r.file_path));
  const valid = paths.filter((p): p is string => Boolean(p));
  const urls = new Map<string, string>();

  if (valid.length) {
    const { data, error } = await storage().createSignedUrls(
      valid,
      SIGNED_URL_TTL_SECONDS,
    );
    if (error) throw error;
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row, i) => {
    const { file_path: _omit, ...rest } = row;
    void _omit;
    const path = paths[i];
    return { ...rest, url: path ? (urls.get(path) ?? null) : null };
  });
}
