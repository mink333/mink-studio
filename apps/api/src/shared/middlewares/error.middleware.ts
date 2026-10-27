import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

import type { ApiErrorResponse, FieldError } from "@workspace/contracts";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public errors?: FieldError[]
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string, errors?: FieldError[]) {
    return new ApiError(400, "BAD_REQUEST", message, errors);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, "FORBIDDEN", message);
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 정의된 도메인/비즈니스 에러인 경우
  if (err instanceof ApiError) {
    const errorBody: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.errors && { errors: err.errors }),
      },
    };
    return res.status(err.statusCode).json(errorBody);
  }

  // 예측하지 못한 500 에러 로깅 및 반환
  console.error("Unhandled Error:", err);
  const internalErrorBody: ApiErrorResponse = {
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "서버 내부 오류가 발생했습니다.",
    },
  };
  return res.status(500).json(internalErrorBody);
};