-- Ejecutar en Supabase SQL Editor si el sitio da "Application error"
-- Agrega las columnas featured_order y offers_order a la tabla products

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "featured_order" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offers_order" INTEGER;
