import { PrismaClient } from "@prisma/client";

/* Cliente único por proceso. Evitamos $extends con reintentos en cada query:
   en Vercel eso multiplicaba latencia y en casos límite podía contribuir a timeouts
   o respuestas incompletas en el home (RSC). */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
