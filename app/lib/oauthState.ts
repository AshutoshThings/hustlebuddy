export const OAUTH_STATE_COOKIE = "google_oauth_state";
export const OAUTH_NEXT_COOKIE = "google_oauth_next";

const isLocalHost = (host: string) =>
  /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);

// Where Google sends the user back.
//
// GOOGLE_REDIRECT_URI wins when set (it must match the Google Cloud console
// entry exactly), except a localhost value seen by a visitor on a real
// domain: that is a dev setting copied to the server, and following it
// would send every Google sign-in to the visitor's own machine.
//
// Otherwise it is the callback on the host the visitor used. Behind a proxy
// request.url names the internal address (often localhost), so the
// forwarded headers come first. A spoofed host is harmless: Google rejects
// redirect URIs that aren't registered.
export function googleRedirectUri(request: Request): string {
  const url = new URL(request.url);
  const first = (name: string) =>
    request.headers.get(name)?.split(",")[0].trim() || null;
  const host = first("x-forwarded-host") ?? first("host") ?? url.host;
  const proto = first("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const own = `${proto}://${host}/api/auth/google/callback`;

  const configured = process.env.GOOGLE_REDIRECT_URI;
  if (!configured) return own;
  try {
    if (isLocalHost(new URL(configured).host) && !isLocalHost(host)) {
      console.warn(
        `GOOGLE_REDIRECT_URI points at localhost; using ${own} instead. Update or remove it on this server.`,
      );
      return own;
    }
  } catch {
    return own; // not a valid URL
  }
  return configured;
}
