import type { HomeProductPlain } from "@/lib/home-data";
import { productInStock } from "@/lib/product-stock";

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
};

export function mapProductToCatalog(p: ProductRow): HomeProductPlain {
  const stock = Number(p.stock ?? 0);
  const useVariants = Boolean(p.useVariants);
  const variants = p.variants;
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
    inStock: productInStock({ stock, useVariants, variants }),
    productType: p.productType ?? "standard",
  };
}

export const catalogListInclude = {
  category: { select: { name: true, slug: true } },
  images: { where: { isPrimary: true }, take: 1 },
  variants: { select: { stock: true } },
} as const;
