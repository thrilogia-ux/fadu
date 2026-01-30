# Fadu.store — E-commerce diseño y arquitectura

Sitio de e-commerce para productos de diseño, arquitectura e iluminación. Inspirado en la usabilidad de Mercado Libre, con panel admin y área de usuarios.

## Fase 1 (actual)

- **Next.js 16** (App Router), TypeScript, Tailwind CSS
- **Prisma** + PostgreSQL (usuarios, categorías, productos, pedidos, cupones, favoritos, notificaciones, hero)
- **NextAuth** con registro manual (email/contraseña) y Google OAuth
- **Logo** Fadu.store en header; estilo limpio y minimalista

## Cómo arrancar

### 1. Base de datos

Necesitás PostgreSQL (local o en la nube: [Neon](https://neon.tech), [Vercel Postgres](https://vercel.com/storage/postgres), [Railway](https://railway.app), etc.).

Copia `.env.example` a `.env.local` y completá:

- `DATABASE_URL`: URL de tu base PostgreSQL
- `AUTH_SECRET`: generá uno con `npx auth secret`
- `AUTH_URL`: en desarrollo `http://localhost:3000`
- Opcional: `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` para login con Google

### 2. Migrar y seed

```bash
npm run db:push
npm run db:seed
```

Esto crea las tablas y carga:

- Usuario admin: **admin@fadustore.com** / **admin123**
- Categorías: Iluminación, Muebles, Decoración, Herramientas de diseño, Arquitectura
- 3 productos de prueba

### 3. Servidor

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Podés registrarte, iniciar sesión (credenciales o Google si configuraste las env) y ver el home con el logo.

## Scripts

| Comando        | Descripción              |
|----------------|--------------------------|
| `npm run dev`  | Servidor de desarrollo   |
| `npm run build`| Build de producción     |
| `npm run start`| Servidor de producción   |
| `npm run db:generate` | Generar cliente Prisma |
| `npm run db:push`     | Aplicar schema a la BD  |
| `npm run db:migrate`  | Crear migración         |
| `npm run db:seed`     | Ejecutar seed           |

## Estructura del proyecto

- `app/` — Rutas y páginas (App Router)
- `components/` — Componentes React
- `lib/` — Prisma client y utilidades
- `prisma/` — Schema y seed
- `auth.ts` — Configuración NextAuth (credenciales + Google)
- `public/fadustore.svg` — Logo

Las categorías y el resto del contenido se administrarán desde el panel en fases siguientes.
