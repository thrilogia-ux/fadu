import { prisma } from "@/lib/prisma";

let ensured = false;

const USER_COLUMNS_SQL = [
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsapp_notify" BOOLEAN NOT NULL DEFAULT false`,
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
  }
}
