import z from "zod";

const email = z.string().trim().toLowerCase().email();

// Rules for choosing a new password (signup, reset). bcrypt only uses the
// first 72 bytes, so longer passwords would silently be truncated.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[\W_]/, "Password must contain at least one special character");

// Login only checks that a password was entered: applying the rules here
// would lock out anyone whose password predates them. The upper bound just
// keeps huge inputs away from bcrypt.
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(1024),
});

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is Required")
    .max(100, "Name must be at most 100 characters"),
  email,
  password: passwordSchema,
});

export const applicationSchema = z.object({
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  status: z.enum(["applied", "interviewing", "offered", "rejected"]),
  source: z.string().trim().max(100).optional(),
  notes: z.string().max(5000).optional(),
  // Which of the user's resumes was sent; null unlinks it.
  resume_id: z.number().int().positive().nullable().optional(),
});

export const applicationOnUpdate = applicationSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "at least 1 value is required",
  );
