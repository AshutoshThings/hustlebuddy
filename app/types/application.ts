export type ApplicationStatus =
  "applied" | "interviewing" | "offered" | "rejected";

export type Application = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  source: string | null;
  notes: string | null;
  // ISO timestamp, for sorting and filtering.
  appliedAt: string;
  // appliedAt formatted for display in the viewer's locale.
  date: string;
};
