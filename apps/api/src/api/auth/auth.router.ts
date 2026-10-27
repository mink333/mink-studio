
import express from "express";
import { kakaoCallback, refresh, logout } from "./auth.controller.js";

const authRouter = express.Router();


authRouter.get('/kakao/callback', kakaoCallback);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);

export default authRouter;
