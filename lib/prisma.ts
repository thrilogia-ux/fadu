import { PrismaClient } from "@prisma/client";

/**
 * Códigos Prisma típicos de red / pooler caído o saturado (Vercel + Supabase).
 * Un par de reintentos suele bastar sin que el usuario tenga que tocar env.
 */
const RETRY_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);

function isRetryableDbError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    RETRY_CODES.has(String((err as { code: string }).code))
  );
}

async function withDbRetry<T>(run: () => Promise<T>): Promise<T> {
  const max = 4;
  let last: unknown;
  for (let i = 0; i < max; i++) {
    try {
      return await run();
    } catch (e) {
      last = e;
      if (isRetryableDbError(e) && i < max - 1) {
        await new Promise((r) => setTimeout(r, 120 * 2 ** i));
        continue;
      }
      throw e;
    }
  }
  throw last;
}

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          return withDbRetry(() => query(args));
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;

/** Para $queryRaw / comprobaciones que no pasan por $allModels */
export { withDbRetry };
