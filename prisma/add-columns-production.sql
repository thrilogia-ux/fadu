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
