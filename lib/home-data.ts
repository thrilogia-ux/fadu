import { prisma } from "@/lib/prisma";

/** Solo JSON serializable (evita fallos al armar el flight RSC hacia el cliente / mobile) */
export function stripForRsc<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

const productHomeInclude = {
  category: { select: { name: true, slug: true } as const },
  images: { where: { isPrimary: true }, take: 1 },
} as const;

/**
 * Home usa columnas que a veces faltan en producción si no se corrió add-columns-production.sql.
 * Si falla (p. ej. featured_order inexistente), repetimos la consulta sin esas columnas.
 */
export async function getHeroSlidesForHome() {
  try {
    const rows = await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        buttonText: true,
        buttonLink: true,
        imageUrl: true,
        imagePosition: true,
      },
    });
    return stripForRsc(rows);
  } catch (e) {
    console.error("[home] heroSlide con imagePosition falló, fallback:", e);
    const rows = await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        buttonText: true,
        buttonLink: true,
        imageUrl: true,
      },
    });
    return stripForRsc(rows);
  }
}

export async function getFeaturedProductsForHome() {
  try {
    const rows = await prisma.product.findMany({
      where: { active: true, featured: true },
      take: 8,
      orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
      include: productHomeInclude,
    });
    return stripForRsc(rows);
  } catch (e) {
    console.error("[home] featuredOrder falló, fallback createdAt:", e);
    const rows = await prisma.product.findMany({
      where: { active: true, featured: true },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: productHomeInclude,
    });
    return stripForRsc(rows);
  }
}

export async function getOffersProductsForHome() {
  try {
    const rows = await prisma.product.findMany({
      where: { active: true, compareAtPrice: { not: null } },
      take: 8,
      orderBy: [{ offersOrder: "asc" }, { createdAt: "desc" }],
      include: productHomeInclude,
    });
    return stripForRsc(rows);
  } catch (e) {
    console.error("[home] offersOrder falló, fallback createdAt:", e);
    const rows = await prisma.product.findMany({
      where: { active: true, compareAtPrice: { not: null } },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: productHomeInclude,
    });
    return stripForRsc(rows);
  }
}

export type HomeCategory = { id: string; name: string; slug: string };

export async function getCategoriesForHome(
  allowedSlugs: string[]
): Promise<HomeCategory[]> {
  try {
    const all = await prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true },
    });
    return stripForRsc(all.filter((c) => allowedSlugs.includes(c.slug)));
  } catch (e) {
    console.error("[home] categorías falló:", e);
    return [];
  }
}
