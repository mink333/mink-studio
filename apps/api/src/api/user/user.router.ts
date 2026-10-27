// src/api/user/user.router.ts
import { Router } from 'express';
import { getMe } from './user.controller.js';
import { authenticateToken, authenticatedHandler } from '../../shared/middlewares/auth.middleware.js';

const userRouter = Router();

// GET /api/user/me
userRouter.get('/me', authenticateToken, authenticatedHandler(getMe));

export default userRouter;