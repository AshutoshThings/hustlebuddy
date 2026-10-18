import z from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one special character"),
});

const signupFields = z.object({
  name: z.string().min(2, "Name is Required"),
});

export const signupSchema = signupFields.merge(loginSchema);

export const applicationSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  status: z.enum(["applied", "interviewing", "offered", "rejected"]),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export const applicationOnUpdate = applicationSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "at least 1 value is required",
  );
