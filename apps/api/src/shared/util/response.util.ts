import { Response } from "express";
import type { ApiResponse } from "@workspace/contracts";

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) => {
  const payload: ApiResponse<T> = { success: true, data };
  return res.status(statusCode).json(payload);
};