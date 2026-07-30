type ProductWithRelations = {
  price: unknown;
  compareAtPrice?: unknown | null;
  bundleDiscountPercent?: unknown | null;
  variants?: { id: string; sizeLabel: string; colorLabel: string; stock: number; sku?: string | null }[];
  videos?: unknown;
  [key: string]: unknown;
};

/** Convierte Decimal de Prisma a número para JSON estable en el cliente. */
export function serializeProductForApi<T extends ProductWithRelations>(
  product: T,
  extras: Record<string, unknown> = {}
) {
  const { videos, ...rest } = product;
  return {
    ...rest,
    price: Number(product.price),
    compareAtPrice:
      product.compareAtPrice != null && product.compareAtPrice !== ""
        ? Number(product.compareAtPrice)
        : null,
    bundleDiscountPercent:
      product.bundleDiscountPercent != null
        ? Number(product.bundleDiscountPercent)
        : null,
    variants: product.variants ?? [],
    videos: Array.isArray(videos) ? videos : [],
    ...extras,
  };
}
