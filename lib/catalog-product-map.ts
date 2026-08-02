import type { HomeProductPlain } from "@/lib/home-data";
import { averageRating, isProductNew } from "@/lib/product-badges";
import { productInStock, productTotalStock } from "@/lib/product-stock";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: unknown;
  compareAtPrice?: unknown | null;
  stock?: number;
  useVariants?: boolean;
  productType?: string | null;
  images: { url: string }[];
  category?: { name: string; slug: string } | null;
  variants?: { stock: number }[];
  createdAt?: Date | string;
  reviews?: { rating: number }[];
};

export function mapProductToCatalog(p: ProductRow): HomeProductPlain {
  const stock = Number(p.stock ?? 0);
  const useVariants = Boolean(p.useVariants);
  const variants = p.variants;
  const stockInput = { stock, useVariants, variants };
  const approvedRatings = (p.reviews ?? []).map((r) => r.rating);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    compareAtPrice:
      p.compareAtPrice != null && p.compareAtPrice !== ""
        ? Number(p.compareAtPrice)
        : null,
    images: p.images.map((img) => ({ url: String(img.url) })),
    category: p.category
      ? { name: p.category.name, slug: p.category.slug }
      : { name: "Productos", slug: "productos" },
    inStock: productInStock(stockInput),
    productType: p.productType ?? "standard",
    totalStock: productTotalStock(stockInput),
    isNew: isProductNew(p.createdAt),
    reviewRating: averageRating(approvedRatings),
    reviewCount: approvedRatings.length,
  };
}

export const catalogListInclude = {
  category: { select: { name: true, slug: true } },
  images: { where: { isPrimary: true }, take: 1 },
  variants: { select: { stock: true } },
  reviews: { where: { status: "approved" }, select: { rating: true } },
} as const;
