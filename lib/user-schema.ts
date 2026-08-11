import { prisma } from "@/lib/prisma";

let ensured = false;

/** Tabla real en Supabase/Prisma: "User" (no "users"). */
const USER_COLUMNS_SQL = [
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsapp_notify" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fadu_career" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fadu_career_other" VARCHAR(255)`,
];

export async function ensureUserSchema(): Promise<void> {
  if (ensured) return;
  try {
    for (const sql of USER_COLUMNS_SQL) {
      await prisma.$executeRawUnsafe(sql);
    }
    ensured = true;
  } catch (e) {
    console.error("[user-schema] ensureUserSchema:", e);
    throw e;
  }
}
