import { prisma } from "@/lib/prisma";

/** Categorías curadas del home — orden de la grilla 3×2. */
export const HOME_EXPLORE_CATEGORIES = [
  { name: "Accesorios", slug: "accesorios", order: 1 },
  { name: "Almacen", slug: "almacen", order: 2 },
  { name: "Deco", slug: "decoracion", order: 3 },
  { name: "Iluminación", slug: "iluminacion", order: 4 },
  { name: "Indumentaria", slug: "indumentaria", order: 5 },
  { name: "Libreria", slug: "libreria", order: 6 },
] as const;

export const HOME_EXPLORE_SLUGS = HOME_EXPLORE_CATEGORIES.map((c) => c.slug);

export const HOME_CATEGORY_ICONS: Record<string, string> = {
  accesorios: "/categorias/accesorios.png",
  almacen: "/categorias/almacen.png",
  decoracion: "/categorias/deco.png",
  iluminacion: "/categorias/iluminacion.png",
  indumentaria: "/categorias/indumentaria.png",
  libreria: "/categorias/libreria.png",
};

/** Crea o actualiza las categorías del home (idempotente). */
export async function ensureHomeExploreCategories(): Promise<void> {
  try {
    for (const c of HOME_EXPLORE_CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name, order: c.order, active: true },
        create: { name: c.name, slug: c.slug, order: c.order, active: true },
      });
    }
  } catch (e) {
    console.error("[home-categories] ensureHomeExploreCategories:", e);
  }
}
