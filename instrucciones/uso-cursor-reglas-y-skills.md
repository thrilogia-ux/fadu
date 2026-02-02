# Cómo usar Cursor: reglas y skills para e-commerce

Guía para aprovechar la regla y el skill creados para proyectos tipo FADU.

---

## 1. ¿Qué tenés configurado?

| Elemento | Ubicación | Alcance |
|----------|-----------|---------|
| **Regla** | `fadu-store/.cursor/rules/ecommerce-fadu.mdc` | Solo este proyecto |
| **Skill** | `~/.cursor/skills/ecommerce-fadu-style/` | Todos tus proyectos |

---

## 2. La regla (ecommerce-fadu)

- Está **dentro del proyecto**.
- Cursor la aplica automáticamente cuando trabajás en este proyecto.
- En un **proyecto nuevo** (otra carpeta) no existe: hay que copiarla o crear una nueva.

### Usar la regla en un proyecto nuevo

1. Crear `.cursor/rules/` en el nuevo proyecto.
2. Copiar `ecommerce-fadu.mdc` desde FADU.
3. Opcional: adaptar el contenido al nuevo proyecto.

---

## 3. El skill (ecommerce-fadu-style)

- Está en tu carpeta de usuario (`~/.cursor/skills/`).
- Cursor lo usa automáticamente cuando detecta pedidos relacionados con e-commerce o FADU.
- Funciona en **todos los proyectos**.

### Cómo indicar que lo use un agente nuevo

Podés decir:

- *"Quiero una tienda online, usá el skill ecommerce-fadu-style"*
- *"Armame un e-commerce similar a FADU"*
- *"Tienda con pickup point como FADU"*
- *"Desarrollo tipo FADU: Next.js, Prisma, admin completo"*

---

## 4. Resumen rápido

| Situación | Qué hacer |
|-----------|-----------|
| Trabajar en FADU | La regla se aplica sola. |
| Nuevo proyecto tipo FADU | Mencionar el skill o copiar la regla. |
| Forzar el skill | *"Usá el skill ecommerce-fadu-style"* |
| Referenciar este proyecto | *"Inspirate en @fadu-store"* (si tenés el proyecto abierto) |

---

## 5. Contenido de la regla (referencia)

La regla define:
- Stack: Next.js App Router, Prisma, Tailwind, NextAuth, Resend, Vercel Blob
- Estructura: Admin, Storefront, Checkout, Pickup point
- UX: Diseño tipo Mercado Libre, mobile-first, iconos PNG

---

## 6. Contenido del skill (referencia)

El skill indica al agente:
- Stack y flujos a implementar
- Catálogo, carrito, checkout, admin, pickup point, emails
- Usar FADU como referencia de estructura y patrones
