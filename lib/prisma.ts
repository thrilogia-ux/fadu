import { PrismaClient } from "@prisma/client";
import { analyzeDatabaseUrl } from "@/lib/database-url";

/* Cliente único por proceso. Evitamos $extends con reintentos en cada query:
   en Vercel eso multiplicaba latencia y en casos límite podía contribuir a timeouts
   o respuestas incompletas en el home (RSC). */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

if (process.env.NODE_ENV === "development") {
  const diag = analyzeDatabaseUrl(process.env.DATABASE_URL);
  if (diag.configured && !diag.serverlessReady) {
    console.warn("[prisma] DATABASE_URL sin config serverless óptima:", diag.warnings.join(" "));
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
