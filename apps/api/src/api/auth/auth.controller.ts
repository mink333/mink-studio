import { NextFunction, Request, Response } from "express";
import * as Service from "./auth.service.js";
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } from "./auth.constants.js";
import { ApiError } from "../../shared/middlewares/error.middleware.js";
import { ApiResponse, RefreshResponse } from "@workspace/contracts";
import { sendSuccess } from "../../shared/util/response.util.js";

export const kakaoCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: '인가 코드가 전달되지 않았습니다.' });
  }

  try {
    const userAgent = req.headers['user-agent'];

    // 1. 카카오 인증 및 토큰 발급/DB 저장
    const { accessToken, refreshToken } = await Service.processKakaoLogin(code, userAgent);

    // 2. Refresh Token을 HttpOnly 쿠키로 설정
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    // 3. 프론트엔드로 리다이렉트
    // (Access Token은 URL query parameter 또는 별도 핸들러로 전달)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  } catch (error: any) {
    console.error('카카오 로그인 처리 실패:', error.response?.data || error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/login?error=auth_failed`);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  const currentToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!currentToken) {
    // 401 표준 에러 던짐
    return next(new ApiError(401, "UNAUTHORIZED", "Refresh token이 없습니다."));
  }

  try {
    const userAgent = req.headers["user-agent"];
    const { accessToken, refreshToken } = await Service.refreshUserTokens(currentToken, userAgent);

    // 1. 새 Refresh Token 쿠키 교체 (Rotation)
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    const data: RefreshResponse = { accessToken };
    return sendSuccess(res, data);
  } catch (error) {
    // 3. 토큰 검증 실패/만료 등 인증 에러(401)일 때만 기존 오염된 쿠키 삭제
    if (error instanceof ApiError && error.statusCode === 401) {
      res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    }

    // 전역 에러 핸들러(errorHandler)로 위임하여 표준화된 JSON 에러 응답 반환
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  const currentToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (currentToken) {
    await Service.revokeRefreshToken(currentToken);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
  return sendSuccess(res, null);
};
