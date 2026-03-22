import { prisma } from "@/lib/prisma";

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
    return await prisma.heroSlide.findMany({
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
  } catch (e) {
    console.error("[home] heroSlide con imagePosition falló, fallback:", e);
    return prisma.heroSlide.findMany({
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
  }
}

export async function getFeaturedProductsForHome() {
  try {
    return await prisma.product.findMany({
      where: { active: true, featured: true },
      take: 8,
      orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
      include: productHomeInclude,
    });
  } catch (e) {
    console.error("[home] featuredOrder falló, fallback createdAt:", e);
    return prisma.product.findMany({
      where: { active: true, featured: true },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: productHomeInclude,
    });
  }
}

export async function getOffersProductsForHome() {
  try {
    return await prisma.product.findMany({
      where: { active: true, compareAtPrice: { not: null } },
      take: 8,
      orderBy: [{ offersOrder: "asc" }, { createdAt: "desc" }],
      include: productHomeInclude,
    });
  } catch (e) {
    console.error("[home] offersOrder falló, fallback createdAt:", e);
    return prisma.product.findMany({
      where: { active: true, compareAtPrice: { not: null } },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: productHomeInclude,
    });
  }
}
