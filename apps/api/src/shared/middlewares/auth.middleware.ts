import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyAccessToken } from "../util/jwt.util.js";
import type { AuthenticatedRequest } from "../types/auth.type.js";

export const authenticatedHandler = (
  handler: (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler => {
  return handler as RequestHandler;
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  // 'Bearer <TOKEN>' 분리
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  try {
    const payload = await verifyAccessToken(token);
    req.user = payload // 라우트 핸들러에서 req.user.userId 사용 가능
    next();
  } catch (error) {
    // 토큰 만료 또는 변조 시 프론트엔드가 Silent Refresh를 시도하도록 401 반환
    return res.status(401).json({ message: '만료되었거나 유효하지 않은 토큰입니다.' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // authenticateToken이 선행 실행되어 req.user가 채워져 있어야 함
    if (!req.user) {
      return res.status(401).json({ message: 'UNAUTHORIZED' });
    }

    if (req.user.userId && !roles.includes(req.user.role)) {
      // 인증은 되었으나 권한이 없으므로 403 Forbidden
      return res.status(403).json({ message: 'FORBIDDEN: Insufficient permissions' });
    }

    next();
  };
};
