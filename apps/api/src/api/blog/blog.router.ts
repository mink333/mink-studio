import express from "express";
import { createPost, getCategories, getPosts, getPostBySlug, getCategoryBySlug, getComments, createComment, editComment, deleteComment, editPost, deletePost, likePost } from "./blog.controller.js";
import { authenticateToken, authenticatedHandler, requireRole } from "../../shared/middlewares/auth.middleware.js";
import { validateBody } from "../../shared/middlewares/validate.middleware.js";
import { CreatePostPayloadSchema } from "@workspace/contracts";

const blogRouter = express.Router();

blogRouter.get("/categories", getCategories);
blogRouter.get("/category/:slug", getCategoryBySlug);
blogRouter.get("/posts", getPosts);
blogRouter.post("/posting", authenticateToken, requireRole(["ADMIN"]), validateBody(CreatePostPayloadSchema), authenticatedHandler(createPost));
blogRouter.patch("/posting/:id", authenticateToken, requireRole(["ADMIN"]), validateBody(CreatePostPayloadSchema), authenticatedHandler(editPost));
blogRouter.delete("/posting/:id", authenticateToken, requireRole(["ADMIN"]), authenticatedHandler(deletePost));
blogRouter.get("/post/:slug", getPostBySlug);
blogRouter.get("/comments/:postId", getComments);
blogRouter.post("/comment", authenticateToken, authenticatedHandler(createComment));
blogRouter.patch("/comment/:id", authenticateToken, authenticatedHandler(editComment));
blogRouter.delete("/comment/:id", authenticateToken, authenticatedHandler(deleteComment));
blogRouter.post("/post/:id/like", authenticateToken, authenticatedHandler(likePost));


export default blogRouter;
