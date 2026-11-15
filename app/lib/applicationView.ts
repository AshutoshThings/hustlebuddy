import type { Application, ApplicationStatus } from "@/app/types/application";

// Shapes an `applications` row from the API into what the dashboard shows.
// No runtime imports, so the tests can load this file directly.

export type ApplicationRow = {
  id: number | string;
  company: string;
  role: string;
  status: ApplicationStatus;
  source?: string | null;
  notes?: string | null;
  applied_at?: string | null;
  created_at?: string | null;
};

export function formatAppliedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function toApplication(row: ApplicationRow): Application {
  const appliedAt = new Date(
    row.applied_at || row.created_at || Date.now(),
  ).toISOString();
  return {
    id: String(row.id),
    company: row.company,
    role: row.role,
    status: row.status,
    source: row.source ?? null,
    notes: row.notes ?? null,
    appliedAt,
    date: formatAppliedAt(appliedAt),
  };
}

export type ApplicationFields = {
  company: string;
  role: string;
  status: ApplicationStatus;
  source: string;
  notes: string;
};

// What a create request should send: blank optional fields are left out.
export function createPayload(form: ApplicationFields) {
  const payload: Partial<ApplicationFields> = {
    company: form.company.trim(),
    role: form.role.trim(),
    status: form.status,
  };
  if (form.source.trim()) payload.source = form.source.trim();
  if (form.notes.trim()) payload.notes = form.notes;
  return payload;
}

// What an edit request should send: only the fields the user changed, so a
// field the form doesn't show (or didn't load) is never overwritten.
export function editPayload(initial: Application, form: ApplicationFields) {
  const before: ApplicationFields = {
    company: initial.company,
    role: initial.role,
    status: initial.status,
    source: initial.source ?? "",
    notes: initial.notes ?? "",
  };
  const payload: Partial<ApplicationFields> = {};
  if (form.company.trim() !== before.company)
    payload.company = form.company.trim();
  if (form.role.trim() !== before.role) payload.role = form.role.trim();
  if (form.status !== before.status) payload.status = form.status;
  if (form.source.trim() !== before.source) payload.source = form.source.trim();
  if (form.notes !== before.notes) payload.notes = form.notes;
  return payload;
}

export type TimeFilter = "all" | "week" | "month";

const DAY_MS = 24 * 60 * 60 * 1000;

// Filters on the stored timestamp, never on the formatted date: the display
// text depends on the browser's language ("16 नव॰ 2026" can't be parsed back).
export function matchesTimeFilter(
  appliedAt: string,
  filter: TimeFilter,
  now: Date = new Date(),
): boolean {
  if (filter === "all") return true;
  const t = new Date(appliedAt);
  if (filter === "month") {
    return (
      t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear()
    );
  }
  const age = now.getTime() - t.getTime();
  return age >= 0 && age <= 7 * DAY_MS;
}
