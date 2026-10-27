import { z } from "zod";

// 1. 세부 필드 검증 에러 항목
export const FieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});
export type FieldError = z.infer<typeof FieldErrorSchema>;

// 2. 공통 실패 응답 스키마
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),             // 예: "VALIDATION_ERROR", "NOT_FOUND", "FORBIDDEN"
    message: z.string(),          // 사용자/개발자 전달 메시지
    errors: z.array(FieldErrorSchema).optional(), // 필드별 에러 상세
  }),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// 3. 공통 성공 응답 팩토리 함수 (Generic Zod Schema)
export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export type ApiResponse<T> = {
  success: true;
  data: T;
};


  // 4. 성공/실패 통합 유니온 스키마 (클라이언트 파싱용)
export const createApiResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.discriminatedUnion("success", [
    createApiResponseSchema(dataSchema),
    ApiErrorResponseSchema,
  ]);

// ⭐️ 추가 권장: 판별 유니온 정적 타입
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;