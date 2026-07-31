import { PrismaClient } from "@prisma/client";
import { analyzeDatabaseUrl, getPrismaDatabaseUrl } from "@/lib/database-url";

/* Cliente único por proceso. La URL se normaliza a Transaction pool (6543) + pgbouncer
   para evitar EMAXCONNSESSION en Vercel con Supabase session mode. */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const databaseUrl = getPrismaDatabaseUrl();

if (process.env.NODE_ENV === "development") {
  const diag = analyzeDatabaseUrl(process.env.DATABASE_URL);
  if (diag.configured && !diag.serverlessReady) {
    console.warn("[prisma] DATABASE_URL sin config serverless óptima:", diag.warnings.join(" "));
  }
  if (databaseUrl && databaseUrl !== process.env.DATABASE_URL?.trim()) {
    console.info("[prisma] DATABASE_URL normalizada para serverless (6543 + pgbouncer).");
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
