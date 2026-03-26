import type { HomeCategory } from "@/lib/home-data";

/**
 * Si Prisma no responde, el home no puede quedar con grilla vacía.
 * Mismas rutas que el seed; IDs falsos solo para keys de React.
 */
export const HOME_CATEGORIES_FALLBACK: HomeCategory[] = [
  { id: "fb-iluminacion", name: "Iluminación", slug: "iluminacion" },
  { id: "fb-escritorio", name: "Escritorio", slug: "escritorio" },
  { id: "fb-decoracion", name: "Decoración", slug: "decoracion" },
  { id: "fb-diseno", name: "Diseño", slug: "diseno" },
  { id: "fb-accesorios", name: "Accesorios", slug: "accesorios" },
];

export function mergeHomeCategories(db: HomeCategory[]): HomeCategory[] {
  return db.length > 0 ? db : HOME_CATEGORIES_FALLBACK;
}
