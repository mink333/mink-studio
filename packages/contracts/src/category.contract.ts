import { z } from "zod";
import { PostListItemSchema } from "./post.contract.js";

export const CategorySchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;


export const CategoryWithPostsSchema = CategorySchema.extend({
  posts: PostListItemSchema.array(),
});
export type CategoryWithPosts = z.infer<typeof CategoryWithPostsSchema>;