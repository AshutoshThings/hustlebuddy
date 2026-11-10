export const OAUTH_STATE_COOKIE = "google_oauth_state";
export const OAUTH_NEXT_COOKIE = "google_oauth_next";

// Where Google sends the user back. GOOGLE_REDIRECT_URI wins when set (it
// must match the Google Cloud console entry exactly). Otherwise it is the
// callback on the host the visitor used: behind a proxy request.url names
// the internal address (often localhost), so read the forwarded headers.
// A spoofed host is harmless: Google rejects unregistered redirect URIs.
export function googleRedirectUri(request: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const url = new URL(request.url);
  const first = (name: string) =>
    request.headers.get(name)?.split(",")[0].trim() || null;
  const host = first("x-forwarded-host") ?? first("host") ?? url.host;
  const proto = first("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}/api/auth/google/callback`;
}
