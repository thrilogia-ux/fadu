-- Ejecutar en Supabase SQL Editor si el sitio da "Application error"
-- Agrega columnas y tablas nuevas usadas en producción
--
-- Si product_reviews ya existe pero da error al enviar opiniones, ejecutá primero:
--   DROP TABLE IF EXISTS product_reviews;
-- y luego todo este script.

-- 1) Productos: orden en home (Destacados / Ofertas)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "featured_order" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offers_order" INTEGER;

-- 2) Hero slides: encuadre de imagen
ALTER TABLE "hero_slides" ADD COLUMN IF NOT EXISTS "image_position" TEXT DEFAULT '50% 50%';

-- 3) Reseñas de productos
-- Si falla con "User", probá cambiar "User" por "users" (según tu schema)
CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" TEXT PRIMARY KEY,
  "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_reviews_product_user_key"
  ON "product_reviews" ("product_id", "user_id");

-- 4) Newsletter suscriptores
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5b) Videos embebidos en ficha de producto (si falta, /api/products/[slug] devolvía 500)
CREATE TABLE IF NOT EXISTS "product_videos" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "url" TEXT,
  "file_path" TEXT,
  "type" TEXT NOT NULL DEFAULT 'url',
  CONSTRAINT "product_videos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_videos_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5) Mensajes marquesina franja superior del header
CREATE TABLE IF NOT EXISTS "top_banner_messages" (
  "id" TEXT PRIMARY KEY,
  "text" VARCHAR(500) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mensajes por defecto de la marquesina (no pisa filas si ya existen esos id)
INSERT INTO "top_banner_messages" ("id", "text", "order", "active", "created_at")
VALUES
  ('seed_topbanner_pickup', 'Retirás tu compra en el Pickup Point en FADU', 0, true, NOW()),
  ('seed_topbanner_fadu15', 'Usa el Cupón FADU15 para tener un 15% OFF en tu compra', 1, true, NOW()),
  ('seed_topbanner_vivi', 'Viví tu identidad FADU en la nueva tienda UBAfadu.shop', 2, true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Perfil de usuario (carrera FADU, teléfono) para /cuenta/perfil
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fadu_career" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fadu_career_other" VARCHAR(255);

-- Pickup Point: dirección y horarios editables
CREATE TABLE IF NOT EXISTS "pickup_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "address" TEXT NOT NULL DEFAULT 'Av. San Juan 350, CABA',
    "notes" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "pickup_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pickup_slots" (
    "id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL DEFAULT 'default',
    "day_of_week" INTEGER NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "pickup_slots_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "pickup_slots"
  ADD CONSTRAINT "pickup_slots_config_id_fkey"
  FOREIGN KEY ("config_id") REFERENCES "pickup_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "pickup_config" ("id", "address", "notes", "updated_at")
VALUES ('default', 'Av. San Juan 350, CABA', 'Presentá el código QR del email o tu número de pedido al retirar.', NOW())
ON CONFLICT ("id") DO NOTHING;

-- S3-S5: waitlist, bundles, modo feria
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

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_total" DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Pedidos: pickup, pago, descuentos (ver también prisma/fix-orders-production.sql)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickup_code" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickup_date" TIMESTAMPTZ;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "picked_up_by" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "picked_up_dni" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "validated_by" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMPTZ;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_pickup_code_key" ON "orders" ("pickup_code") WHERE "pickup_code" IS NOT NULL;

-- Páginas legales (JSON en store_settings, clave legal_pages)
INSERT INTO "store_settings" ("key", "value", "updated_at")
VALUES ('legal_pages', '{}', NOW())
ON CONFLICT ("key") DO NOTHING;
