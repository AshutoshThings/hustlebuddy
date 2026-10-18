const ALLOWED = ["/dashboard", "/extension-auth"];

export function safeNext(next: string | null, fallback = "/dashboard") {
  return next && ALLOWED.includes(next) ? next : fallback;
}
