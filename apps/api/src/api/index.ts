import { Router } from 'express';
import authRouter from './auth/auth.router.js';
import uploadRouter from './upload/upload.router.js';
import userRouter from './user/user.router.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/user', userRouter);

export default apiRouter;