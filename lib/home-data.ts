import { prisma } from "@/lib/prisma";
import type { HomeHeroSlide } from "@/components/HomeHero";
import { runWithDbRetries } from "@/lib/db-retry";
import { homeFeaturedOrderBy, homeOffersOrderBy } from "@/lib/product-list-order";

const productHomeInclude = {
  category: { select: { name: true, slug: true } as const },
  images: { where: { isPrimary: true }, take: 1 },
} as const;

type ProductHomeRow = Awaited<ReturnType<typeof getFeaturedProductsForHomeRaw>>[number];

async function getFeaturedProductsForHomeRaw() {
  return prisma.product.findMany({
    where: { active: true, featured: true },
    take: 8,
    orderBy: homeFeaturedOrderBy,
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
    category: p.category
      ? { name: p.category.name, slug: p.category.slug }
      : { name: "Productos", slug: "productos" },
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
  const rows = await runWithDbRetries("home.heroSlide", () =>
    prisma.heroSlide.findMany({
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
    })
  );
  if (rows && rows.length > 0) return mapHeroRows(rows);

  const rowsNoPos = await runWithDbRetries("home.heroSlide.noImagePosition", () =>
    prisma.heroSlide.findMany({
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
    })
  );
  if (rowsNoPos && rowsNoPos.length > 0) return mapHeroRows(rowsNoPos);
  return [];
}

async function getRecentActiveProducts(take: number): Promise<ProductHomeRow[]> {
  const r = await runWithDbRetries("home.products.recent", () =>
    prisma.product.findMany({
      where: { active: true },
      take,
      orderBy: { createdAt: "desc" },
      include: productHomeInclude,
    })
  );
  return r ?? [];
}

export async function getFeaturedProductsForHome(): Promise<HomeProductPlain[]> {
  let rows =
    (await runWithDbRetries("home.products.featured", () => getFeaturedProductsForHomeRaw())) ?? [];
  if (rows.length === 0) {
    rows = await getRecentActiveProducts(8);
  }
  if (rows.length === 0) {
    const { loadFeaturedFromApi } = await import("@/lib/home-api-fallback");
    const viaApi = await loadFeaturedFromApi();
    if (viaApi.length > 0) return viaApi;
  }

  return rows.map(toHomeProductPlain);
}

export async function getOffersProductsForHome(): Promise<HomeProductPlain[]> {
  let rows =
    (await runWithDbRetries("home.products.offers", () =>
      prisma.product.findMany({
        where: { active: true, compareAtPrice: { not: null } },
        take: 8,
        orderBy: homeOffersOrderBy,
        include: productHomeInclude,
      })
    )) ?? [];

  if (rows.length === 0) {
    const { loadOffersFromApi } = await import("@/lib/home-api-fallback");
    const viaApi = await loadOffersFromApi();
    if (viaApi.length > 0) return viaApi;
  }

  return rows.map(toHomeProductPlain);
}

export type HomeCategory = { id: string; name: string; slug: string };

/** Todas las categorías activas (mismo orden que admin: campo `order`). Para header y navegación. */
export async function getAllActiveCategories(): Promise<HomeCategory[]> {
  let all = await runWithDbRetries("home.categories.all", () =>
    prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true },
    })
  );
  let list = all ?? [];
  if (list.length === 0) {
    const { loadCategoriesFromApi } = await import("@/lib/home-api-fallback");
    list = await loadCategoriesFromApi();
  }
  return list;
}

/**
 * Subconjunto para la grilla del home con iconos fijos (orden de `preferredSlugs`).
 * Si ninguna coincide con la DB, se muestran todas.
 */
export function categoriesForHomeExplorationGrid(
  all: HomeCategory[],
  preferredSlugs: string[]
): HomeCategory[] {
  const curated = preferredSlugs
    .map((slug) => all.find((c) => c.slug === slug))
    .filter((c): c is HomeCategory => c != null);
  return curated.length > 0 ? curated : all;
}
