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
  ('seed_topbanner_vivi', 'Viví tu identidad FADU en la nueva tienda FADU.Store', 2, true, NOW())
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
