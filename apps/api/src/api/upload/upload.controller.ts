import fs from "fs";
import sharp from "sharp";
import { Request, Response } from "express";
import { ApiError } from "../../shared/middlewares/error.middleware.js";
import { UploadRespnse } from "@workspace/contracts";
import { sendSuccess } from "../../shared/util/response.util.js";

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest("이미지 파일만 업로드할 수 있거나 파일이 선택되지 않았습니다.");

  // 업로드된 파일의 width, height 추출
  const buffer = fs.readFileSync(req.file.path);
  const metadata = await sharp(buffer).metadata();

  // 클라이언트가 접근할 정적 URL 생성
  const fileUrl = `/uploads/${req.file.filename}`;

  const payload: UploadRespnse = {
    url: fileUrl,
    width: metadata.width,
    height: metadata.height,
  }

  return sendSuccess(res, payload);
}
