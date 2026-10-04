export type ApplicationStatus =
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected";

export type Application = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  date: string;
};
