import { z } from "zod";
import { UserSchema } from "./user.contract.js";

export const CommentSchema = z.object({
  id: z.number().int(),
  content: z.string().max(1000, "댓글 내용은 1000자 이하여야 합니다."),
  postId: z.number().int(),
  authorId: z.string().nullable(),
  parentId: z.number().int().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CommentListItemResponseSchema = CommentSchema.omit({
  authorId: true,
  postId: true,
}).extend({
  author: UserSchema.pick({
    id: true,
    name: true,
    image: true,
  }).nullable(),
});
export type CommentItemResponse = z.infer<typeof CommentListItemResponseSchema>
