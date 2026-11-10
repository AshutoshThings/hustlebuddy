// Message to show for a caught error, which TypeScript types as unknown.
export function errorMessage(
  err: unknown,
  fallback = "Something went wrong",
): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
