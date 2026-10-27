import { z } from "zod";

export const RefreshTokenSchema = z.object({
  id: z.string(),
  token: z.string(),
  userId: z.string(),
  userAgent: z.string().nullable(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;