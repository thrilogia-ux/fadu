import type { HomeProductPlain } from "@/lib/home-data";
import { averageRating, isProductNew } from "@/lib/product-badges";
import { productInStock, productTotalStock } from "@/lib/product-stock";

export function normalizeApiProduct(p: unknown): HomeProductPlain | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const cat = o.category as { name?: string; slug?: string } | undefined;
  const rawImages = Array.isArray(o.images) ? o.images : [];
  const images = rawImages
    .map((img) => ({ url: String((img as { url?: string }).url ?? "") }))
    .filter((i) => i.url.length > 0);
  if (typeof o.id !== "string" || typeof o.name !== "string" || typeof o.slug !== "string") return null;
  const variants = Array.isArray(o.variants)
    ? o.variants.map((v) => ({ stock: Number((v as { stock?: number }).stock ?? 0) }))
    : undefined;
  const stock = Number(o.stock ?? 0);
  const useVariants = Boolean(o.useVariants);
  const stockInput = { stock, useVariants, variants };
  const approvedRatings = Array.isArray(o.reviews)
    ? o.reviews.map((r) => Number((r as { rating?: number }).rating ?? 0)).filter((n) => n > 0)
    : [];
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
    inStock: productInStock(stockInput),
    productType: typeof o.productType === "string" ? o.productType : "standard",
    totalStock: productTotalStock(stockInput),
    isNew: isProductNew(o.createdAt as string | undefined),
    reviewRating: averageRating(approvedRatings),
    reviewCount: approvedRatings.length,
  };
}

export function normalizeApiProductList(data: unknown, max = 8): HomeProductPlain[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((x) => normalizeApiProduct(x))
    .filter((x): x is HomeProductPlain => x != null)
    .slice(0, max);
}
