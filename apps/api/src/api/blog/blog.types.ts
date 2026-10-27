import { TiptapContent, TocItem } from "@workspace/contracts";

export interface PostImage {
  url: string;
  width: number;
  height: number;
  displayOrder: number;
}

export type CreatePostInput = {
  title: string;
  summary: string;
  content: Record<string, unknown>;
  categoryName: string;
  images: PostImage[];
}

export type CreateCommentInput = {
  postId: number;
  content: string;
  parentId?: number | null;
}

export type EditCommentInput = {
  content: string;
}

export type PostMetaResult = {
  summary: string;
  toc: TocItem[];
  content: TiptapContent;
}
