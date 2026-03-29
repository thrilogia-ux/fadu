-- Permitir borrar productos con líneas en pedidos: se conserva nombre en snapshot y product_id pasa a NULL
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_name_snapshot" TEXT;

UPDATE "order_items" o
SET "product_name_snapshot" = p."name"
FROM "Product" p
WHERE o."product_id" = p."id"
  AND (o."product_name_snapshot" IS NULL OR o."product_name_snapshot" = '');

ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_product_id_fkey";

ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
