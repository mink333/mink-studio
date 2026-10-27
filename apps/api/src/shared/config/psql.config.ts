import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import type { TocItem, TiptapContent } from "@workspace/contracts";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30 * 1000,
  connectionTimeoutMillis: 2 * 1000,
});

const adapter = new PrismaPg(pool);

// 1. Prisma 클라이언트 생성 및 $extends 설정
const createExtendedClient = () => {
  return new PrismaClient({ adapter }).$extends({
    result: {
      post: {
        content: {
          needs: { content: true },
          compute(post) {
            return post.content as unknown as TiptapContent;
          },
        },
        toc: {
          needs: { toc: true },
          compute(post) {
            // 목차는 비어있을 수 있으므로 null 허용
            return post.toc as unknown as TocItem[];
          },
        },
      },
    },
  });
};

// 2. 확장된 클라이언트의 타입을 정확히 추출
export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

// shared/config/psql.config.ts에 추가 export
export type ExtendedTransactionClient = Parameters<
  Parameters<ExtendedPrismaClient["$transaction"]>[0]
>[0];

// 3. HMR/싱글톤 처리를 위한 global 타입 선언
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? createExtendedClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;