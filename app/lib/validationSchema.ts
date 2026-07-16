import zod from "zod";

export const validationSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(6),
});

export const applicationSchema = zod.object({
  company: zod.string().min(1),
  role: zod.string().min(1),
  status: zod.enum(["applied", "interviewing", "offered", "rejected"]),
  source: zod.string().optional(),
  notes: zod.string().optional(),
});

export const applicationOnUpdate = applicationSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "at least 1 value is required",
  );
