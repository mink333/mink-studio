// apps/backend/src/shared/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ApiError } from "./error.middleware.js";

export const validateBody = <T>(schema: z.ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return next(
          new ApiError(400, "VALIDATION_ERROR", "요청 데이터가 유효하지 않습니다.", fieldErrors)
        );
      }
      next(error);
    }
  };
};
