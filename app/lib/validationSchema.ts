import zod from "zod";

export const validationSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(6),
});
