import { z } from "zod";
import type { JSONContent } from "@tiptap/core";
import { CategorySchema, PostImageSchema, UserSchema, LikeSchema } from "./index.js";

export const TocItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  level: z.number().int().positive(),
})
export type TocItem = z.infer<typeof TocItemSchema>;

export const TiptapContentSchema = z.custom<JSONContent>(
  (val) => {
    return (
      typeof val === "object" &&
      val !== null &&
      !Array.isArray(val) &&
      "type" in val &&
      (val as Record<string, unknown>).type === "doc"
    );
  },
  {
    message: "유효한 Tiptap JSONContent 형식이 아닙니다.",
  }
);

export type TiptapContent = z.infer<typeof TiptapContentSchema>;
export type TiptapContentItem = JSONContent;

export const PostSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  categoryId: z.number().int(),
  title: z.string(),
  summary: z.string(),
  toc: TocItemSchema.array(),
  content: TiptapContentSchema,
  authorId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PostListItemSchema = PostSchema.omit({
  categoryId: true,
  authorId: true,
  toc: true,
  content: true,
}).extend({
  category: CategorySchema,
  images: PostImageSchema.array(),
  _count: z.object({
    likes: z.number().int(),
    comments: z.number().int(),
  })
});
export type PostListItem = z.infer<typeof PostListItemSchema>;

export const PostDetailSchema = PostSchema.omit({
  slug: true,
  categoryId: true,
  summary: true,
  authorId: true,
}).extend({
  author: UserSchema.pick({
    id: true,
    name: true,
    image: true,
  }),
  category: CategorySchema.pick({ name: true }),
  likes: LikeSchema.pick({ userId: true }).array(),
  images: PostImageSchema.pick({ url: true, width: true, height: true }).array(),
});
export type PostDetail = z.infer<typeof PostDetailSchema>;

export const CreatePostPayloadSchema = PostSchema.pick({
  title: true,
  content: true,
}).extend({
  categoryName: z.string(),
  images: PostImageSchema.array(),
});
export type CreatePostPayload = z.infer<typeof CreatePostPayloadSchema>;

export const CreatePostResponseSchema = PostSchema.pick({
  slug: true,
}).extend({
  category: CategorySchema.pick({ slug: true })
});
export type CreatePostResponse = z.infer<typeof CreatePostResponseSchema>
