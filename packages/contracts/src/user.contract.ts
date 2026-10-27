import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  email: z.string().email(),
  role: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
