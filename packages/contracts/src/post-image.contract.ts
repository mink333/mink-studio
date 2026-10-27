import { z } from "zod";

// 2. PostImage Base
export const PostImageSchema = z.object({
  id: z.number().int(),
  postId: z.number().int(),
  url: z.string().url("올바른 이미지 URL이어야 합니다."),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  displayOrder: z.number().int().default(0),
  createdAt: z.date(),
});
export type PostImage = z.infer<typeof PostImageSchema>;

export const UploadResponseSchema = PostImageSchema.pick({
  url: true,
  width: true,
  height: true,
});
export type UploadRespnse = z.infer<typeof UploadResponseSchema>;
