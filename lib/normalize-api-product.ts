import type { HomeProductPlain } from "@/lib/home-data";

export function normalizeApiProduct(p: unknown): HomeProductPlain | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const cat = o.category as { name?: string; slug?: string } | undefined;
  const rawImages = Array.isArray(o.images) ? o.images : [];
  const images = rawImages
    .map((img) => ({ url: String((img as { url?: string }).url ?? "") }))
    .filter((i) => i.url.length > 0);
  if (typeof o.id !== "string" || typeof o.name !== "string" || typeof o.slug !== "string") return null;
  return {
    id: o.id,
    name: o.name,
    slug: o.slug,
    price: Number(o.price),
    compareAtPrice:
      o.compareAtPrice != null && o.compareAtPrice !== "" ? Number(o.compareAtPrice) : null,
    images,
    category:
      cat?.name && cat?.slug
        ? { name: cat.name, slug: cat.slug }
        : { name: "Productos", slug: "productos" },
  };
}

export function normalizeApiProductList(data: unknown, max = 8): HomeProductPlain[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((x) => normalizeApiProduct(x))
    .filter((x): x is HomeProductPlain => x != null)
    .slice(0, max);
}
