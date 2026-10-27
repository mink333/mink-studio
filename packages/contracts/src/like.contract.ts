import { z } from "zod";

export const LikeSchema = z.object({
  id: z.number().int(),
  postId: z.number().int(),
  userId: z.string(),
  createdAt: z.string().datetime(),
});