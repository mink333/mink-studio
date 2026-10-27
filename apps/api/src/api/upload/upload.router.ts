import express from 'express'
import { uploadFile } from './upload.controller.js'
import { upload } from './upload.middleware.js';
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware.js';

const uploadRouter = express.Router();
uploadRouter.post('/image', authenticateToken, requireRole(["ADMIN"]), upload.single("file"), uploadFile);

export default uploadRouter;
