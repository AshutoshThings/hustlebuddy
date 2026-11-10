// Refresh tokens rotate on every use, so two refreshes racing in one tab
// would make the loser fail and look like a logout. Everything in the
// browser refreshes through here, and concurrent callers share one request.
let inflight: Promise<string | null> | null = null;

export function refreshSession(): Promise<string | null> {
  inflight ??= fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => (data?.accessToken as string | undefined) ?? null)
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
