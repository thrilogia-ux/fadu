import type { HomeCategory } from "@/lib/home-data";
import { HOME_EXPLORE_CATEGORIES } from "@/lib/home-categories";

/**
 * Si Prisma no responde, el home no puede quedar con grilla vacía.
 * Mismas rutas que ensureHomeExploreCategories; IDs falsos solo para keys de React.
 */
export const HOME_CATEGORIES_FALLBACK: HomeCategory[] = HOME_EXPLORE_CATEGORIES.map((c) => ({
  id: `fb-${c.slug}`,
  name: c.name,
  slug: c.slug,
}));

export function mergeHomeCategories(db: HomeCategory[]): HomeCategory[] {
  return db.length > 0 ? db : HOME_CATEGORIES_FALLBACK;
}
