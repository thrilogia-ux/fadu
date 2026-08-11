import { prisma } from "@/lib/prisma";

let ensured = false;

const ORDER_COLUMNS_SQL = [
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickup_code" TEXT`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" TEXT`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_id" TEXT`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_total" DECIMAL(10, 2) NOT NULL DEFAULT 0`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickup_date" TIMESTAMPTZ`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "picked_up_by" TEXT`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "picked_up_dni" TEXT`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "validated_by" TEXT`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMPTZ`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_method" TEXT NOT NULL DEFAULT 'pickup'`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_cost" DECIMAL(10, 2) NOT NULL DEFAULT 0`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_zone_id" TEXT`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_zone_name" TEXT`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_postal_code" TEXT`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_address" TEXT`,
];

const ORDER_ITEM_COLUMNS_SQL = [
  `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_name_snapshot" TEXT`,
  `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_id" TEXT`,
  `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_size_label" TEXT`,
  `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_color_label" TEXT`,
];

const ORDER_INDEX_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS "orders_pickup_code_key" ON "orders" ("pickup_code")
WHERE "pickup_code" IS NOT NULL
`;

const ORDER_STATUS_HISTORY_SQL = `
CREATE TABLE IF NOT EXISTS "order_status_history" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
)
`;

/**
 * Asegura columnas/tablas de pedidos que a veces faltan en Supabase producción.
 */
export async function ensureOrderSchema(): Promise<void> {
  if (ensured) return;
  try {
    for (const sql of ORDER_COLUMNS_SQL) {
      await prisma.$executeRawUnsafe(sql);
    }
    for (const sql of ORDER_ITEM_COLUMNS_SQL) {
      await prisma.$executeRawUnsafe(sql);
    }
    await prisma.$executeRawUnsafe(ORDER_INDEX_SQL);
    await prisma.$executeRawUnsafe(ORDER_STATUS_HISTORY_SQL);
    ensured = true;
  } catch (e) {
    console.error("[order-schema] ensureOrderSchema:", e);
  }
}

export function prismaErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  return undefined;
}

export function isMissingColumnError(error: unknown, column?: string): boolean {
  const msg = prismaErrorMessage(error)?.toLowerCase() ?? "";
  const missing =
    msg.includes("does not exist") ||
    msg.includes("no existe") ||
    msg.includes("column") && msg.includes("not found");
  if (!column) return missing;
  return missing && msg.includes(column.toLowerCase());
}

export function isMissingDiscountColumnError(error: unknown): boolean {
  return isMissingColumnError(error, "discount_total");
}

export function isMissingPickupCodeColumnError(error: unknown): boolean {
  return isMissingColumnError(error, "pickup_code");
}
