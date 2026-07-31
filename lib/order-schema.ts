import { prisma } from "@/lib/prisma";

let ensured = false;

/**
 * Asegura columnas de pedidos que a veces faltan en Supabase producción
 * (si no se ejecutó add-columns-production.sql).
 */
export async function ensureOrderSchema(): Promise<void> {
  if (ensured) return;
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_total" DECIMAL(10, 2) NOT NULL DEFAULT 0`
    );
    ensured = true;
  } catch (e) {
    console.error("[order-schema] no se pudo asegurar discount_total:", e);
  }
}

export function prismaErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  return undefined;
}

export function isMissingDiscountColumnError(error: unknown): boolean {
  const msg = prismaErrorMessage(error)?.toLowerCase() ?? "";
  return msg.includes("discount_total") && (msg.includes("does not exist") || msg.includes("no existe"));
}
