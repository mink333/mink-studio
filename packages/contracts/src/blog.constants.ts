// packages/contracts/src/blog/blog.constants.ts
export const BLOG_CONSTANTS = {
  CATEGORY_ALL: "all",
  MAIN_IMAGE_ORDER: 0,
} as const;

export type BlogConstants = typeof BLOG_CONSTANTS;