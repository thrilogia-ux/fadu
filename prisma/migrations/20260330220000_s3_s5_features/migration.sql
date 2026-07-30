-- S3-S5: waitlist, bundles, fair mode settings, product type

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "product_type" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bundle_discount_percent" INTEGER;

CREATE TABLE IF NOT EXISTS "stock_waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "user_id" TEXT,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "notified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "stock_waitlist_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stock_waitlist_product_id_idx" ON "stock_waitlist"("product_id");
CREATE INDEX IF NOT EXISTS "stock_waitlist_email_idx" ON "stock_waitlist"("email");

DO $$ BEGIN
  ALTER TABLE "stock_waitlist" ADD CONSTRAINT "stock_waitlist_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "stock_waitlist" ADD CONSTRAINT "stock_waitlist_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "stock_waitlist" ADD CONSTRAINT "stock_waitlist_variant_id_fkey"
    FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "bundle_items" (
    "id" TEXT NOT NULL,
    "bundle_product_id" TEXT NOT NULL,
    "component_product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bundle_items_bundle_product_id_idx" ON "bundle_items"("bundle_product_id");

DO $$ BEGIN
  ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_product_id_fkey"
    FOREIGN KEY ("bundle_product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_component_product_id_fkey"
    FOREIGN KEY ("component_product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "store_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("key")
);

INSERT INTO "store_settings" ("key", "value", "updated_at")
VALUES
  ('fair_mode_enabled', 'false', NOW()),
  ('fair_mode_title', 'Modo feria FADU', NOW()),
  ('fair_mode_message', 'Compra rápida en el stand. Retirá en el pickup con tu QR.', NOW()),
  ('fair_mode_hide_mercadopago', 'true', NOW())
ON CONFLICT ("key") DO NOTHING;
