-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_variants" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "show_size_selector" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "show_color_selector" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "size_label" TEXT NOT NULL DEFAULT '',
    "color_label" TEXT NOT NULL DEFAULT '',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_product_id_size_label_color_label_key" ON "product_variants"("product_id", "size_label", "color_label");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_product_id_fkey'
  ) THEN
    ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable order_items
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_id" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_size_label" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_color_label" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_variant_id_fkey'
  ) THEN
    ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey"
      FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
