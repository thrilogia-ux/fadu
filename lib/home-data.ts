import { prisma } from "@/lib/prisma";
import type { HomeHeroSlide } from "@/components/HomeHero";

const productHomeInclude = {
  category: { select: { name: true, slug: true } as const },
  images: { where: { isPrimary: true }, take: 1 },
} as const;

type ProductHomeRow = Awaited<ReturnType<typeof getFeaturedProductsForHomeRaw>>[number];

async function getFeaturedProductsForHomeRaw() {
  return prisma.product.findMany({
    where: { active: true, featured: true },
    take: 8,
    orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
    include: productHomeInclude,
  });
}

/** Props listas para ProductCard y para el payload RSC (sin Decimal ni tipos raros de Prisma) */
export type HomeProductPlain = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: { url: string }[];
  category: { name: string; slug: string };
};

function toHomeProductPlain(p: ProductHomeRow): HomeProductPlain {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    images: (p.images ?? []).map((img) => ({ url: String(img.url) })),
    category: { name: p.category.name, slug: p.category.slug },
  };
}

function mapHeroRows(
  rows: {
    id: string;
    title: string | null;
    subtitle: string | null;
    buttonText: string | null;
    buttonLink: string | null;
    imageUrl: string | null;
    imagePosition?: string | null;
  }[]
): HomeHeroSlide[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    buttonText: r.buttonText,
    buttonLink: r.buttonLink,
    imageUrl: r.imageUrl,
    imagePosition: r.imagePosition ?? null,
  }));
}

/**
 * Slides para HomeHero (cliente): solo objetos planos. Nunca lanza.
 */
export async function getHeroSlidesForHome(): Promise<HomeHeroSlide[]> {
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
    return mapHeroRows(rows);
  } catch (e) {
    console.error("[home] heroSlide con imagePosition falló, fallback:", e);
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
        },
      });
      return mapHeroRows(rows);
    } catch (e2) {
      console.error("[home] heroSlide fallback falló:", e2);
      return [];
    }
  }
}

export async function getFeaturedProductsForHome(): Promise<HomeProductPlain[]> {
  try {
    const rows = await getFeaturedProductsForHomeRaw();
    return rows.map(toHomeProductPlain);
  } catch (e) {
    console.error("[home] featuredOrder falló, fallback createdAt:", e);
    try {
      const rows = await prisma.product.findMany({
        where: { active: true, featured: true },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: productHomeInclude,
      });
      return rows.map(toHomeProductPlain);
    } catch (e2) {
      console.error("[home] destacados no disponibles:", e2);
      return [];
    }
  }
}

export async function getOffersProductsForHome(): Promise<HomeProductPlain[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { active: true, compareAtPrice: { not: null } },
      take: 8,
      orderBy: [{ offersOrder: "asc" }, { createdAt: "desc" }],
      include: productHomeInclude,
    });
    return rows.map(toHomeProductPlain);
  } catch (e) {
    console.error("[home] offersOrder falló, fallback createdAt:", e);
    try {
      const rows = await prisma.product.findMany({
        where: { active: true, compareAtPrice: { not: null } },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: productHomeInclude,
      });
      return rows.map(toHomeProductPlain);
    } catch (e2) {
      console.error("[home] ofertas no disponibles:", e2);
      return [];
    }
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
    return all.filter((c) => allowedSlugs.includes(c.slug));
  } catch (e) {
    console.error("[home] categorías falló:", e);
    return [];
  }
}
