
import * as Service from "./blog.service.js";
import { Request, Response } from "express";
import { CreateCommentInput, CreatePostInput } from "./blog.types.js";
import { AuthenticatedRequest } from "../../shared/types/auth.type.js";
import { CreatePostPayload } from "@workspace/contracts";
import { sendSuccess } from "../../shared/util/response.util.js";

export async function getCategories(req: Request, res: Response) {
  const categories = await Service.getCategories();
  return sendSuccess(res, categories);
}

export async function getCategoryBySlug(req: Request, res: Response) {
  const slug = req.params.slug as string;
  const category = await Service.getCategoryBySlug(slug);
  return sendSuccess(res, category);
}

export async function getPosts(req: Request, res: Response) {
  const categorySlug = req.query.categorySlug as string;
  const posts = await Service.getPosts(categorySlug);
  return sendSuccess(res, posts);
}

export async function getPostBySlug(req: Request, res: Response) {
  const slug = req.params.slug as string;
  const post = await Service.getPostBySlug(slug);
  return sendSuccess(res, post);
}

export async function createPost(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.userId;
  const result = await Service.createPost(req.body, authorId);
  return sendSuccess(res, result, 201);
}

export async function editPost(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.userId;
  const postId = parseInt(req.params.id as string);
  const result = await Service.editPost(req.body, authorId, postId);
  return sendSuccess(res, result, 204);
}

export async function deletePost(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.userId;
  const postId = parseInt(req.params.id as string);
  const goto = await Service.deletePost(authorId, postId);
  return res.redirect(`${process.env.FRONTEND_URL}${goto}`);
}

export async function getComments(req: Request, res: Response) {
  const postId = parseInt(req.params.postId as string);
  const comments = await Service.getComments(postId);
  return sendSuccess(res, comments);
}

export async function createComment(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.userId;
  const comment = req.body as CreateCommentInput;

  const result = await Service.createComment(comment, authorId);
  return res.status(201).json(result);
}

export async function editComment(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.userId;
  const id = parseInt(req.params.id as string);
  const comment = req.body as CreateCommentInput;
  await Service.editComment(id, comment.content, authorId);
  return res.status(204).send();
}

export async function deleteComment(req: AuthenticatedRequest, res: Response) {
  const authorId = req.user.userId;
  const id = parseInt(req.params.id as string);
  const result = await Service.deleteComment(id, authorId);
  return res.status(200).json({deletedIds: result});
}

export async function likePost(req: AuthenticatedRequest, res: Response) {
  const userId = req.user.userId;
  const postId = parseInt(req.params.id as string);
  await Service.likePost(postId, userId);
  return res.status(204).send();
}
