# Configurar base de datos PostgreSQL (Railway - GRATIS)

## Opción rápida: Railway

1. Andá a https://railway.app
2. Hacé clic en "Start a New Project"
3. Elegí "Provision PostgreSQL"
4. Una vez creado, hacé clic en el proyecto PostgreSQL
5. En la pestaña "Connect", copiá la **"Postgres Connection URL"**
   - Empieza con `postgresql://postgres:...`
6. Pegala en `.env.local` reemplazando `DATABASE_URL`

## Después de configurar DATABASE_URL

Ejecutá desde `fadu-store/`:

```bash
npm run db:push
npm run db:seed
```

Eso crea:
- Usuario admin: **admin@fadustore.com** / **admin123**
- 5 categorías
- 3 productos de ejemplo

Luego refrescá http://localhost:3000 y probá iniciar sesión.

## Vercel: "Application error" / Digest al abrir el sitio

Suele pasar si el código nuevo usa columnas o tablas que **todavía no existen** en Supabase.

1. Abrí **Supabase → SQL Editor** y ejecutá todo el script [`prisma/add-columns-production.sql`](prisma/add-columns-production.sql) (incluye `featured_order`, `offers_order`, `image_position`, `top_banner_messages`, etc.).
2. Volvé a cargar **fadustore.vercel.app**.

El home ahora intenta **consultas de respaldo** si faltan columnas de orden o `image_position`, pero conviene tener la DB al día para portada, hero y marquesina.
