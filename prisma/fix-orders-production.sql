-- Ejecutar en Supabase → SQL Editor si falla crear pedido (pickup_code, discount_total, etc.)
-- Seguro de correr varias veces (IF NOT EXISTS).

-- Tabla orders: columnas de pickup y pago
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickup_code" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_total" DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickup_date" TIMESTAMPTZ;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "picked_up_by" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "picked_up_dni" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "validated_by" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMPTZ;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_pickup_code_key" ON "orders" ("pickup_code")
WHERE "pickup_code" IS NOT NULL;

-- Líneas de pedido
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_name_snapshot" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_id" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_size_label" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_color_label" TEXT;

-- Historial de estados del pedido
CREATE TABLE IF NOT EXISTS "order_status_history" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
