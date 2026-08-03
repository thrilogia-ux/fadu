import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

let ensured = false;

/** Columnas que Prisma espera pero pueden faltar en Supabase producción */
const PRODUCT_COLUMNS_SQL = [
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost_price" DECIMAL(10, 2)`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "featured_order" INTEGER`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offers_order" INTEGER`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_variants" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "show_size_selector" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "show_color_selector" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_type" TEXT NOT NULL DEFAULT 'standard'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "bundle_discount_percent" INTEGER`,
];

const PRODUCT_REVIEW_STATUS_SQL = `
ALTER TABLE "product_reviews" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending'
`;

export async function ensureProductSchema(): Promise<void> {
  if (ensured) return;
  try {
    for (const sql of PRODUCT_COLUMNS_SQL) {
      await prisma.$executeRawUnsafe(sql);
    }
    try {
      await prisma.$executeRawUnsafe(PRODUCT_REVIEW_STATUS_SQL);
    } catch {
      /* tabla product_reviews puede no existir aún */
    }
    ensured = true;
  } catch (e) {
    console.error("[product-schema] ensureProductSchema:", e);
  }
}

export const productListIncludeMinimal = {
  category: { select: { name: true, slug: true } },
  images: { where: { isPrimary: true }, take: 1 },
} as const;

export const productListIncludeWithVariants = {
  ...productListIncludeMinimal,
  variants: { select: { stock: true } },
} as const;

export const productListIncludeFull = {
  ...productListIncludeWithVariants,
  reviews: { where: { status: "approved" }, select: { rating: true } },
} as const;

type ListArgs = {
  where: Prisma.ProductWhereInput;
  take: number;
  orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
};

/**
 * Lista productos con includes degradables si falta schema de reseñas/variantes.
 */
export async function findProductsForList(args: ListArgs) {
  await ensureProductSchema();

  const attempts: Array<typeof productListIncludeFull | typeof productListIncludeWithVariants | typeof productListIncludeMinimal> = [
    productListIncludeFull,
    productListIncludeWithVariants,
    productListIncludeMinimal,
  ];

  let lastError: unknown;
  for (const include of attempts) {
    try {
      return await prisma.product.findMany({
        where: args.where,
        take: args.take,
        orderBy: args.orderBy,
        include,
      });
    } catch (e) {
      lastError = e;
      console.warn("[product-queries] findProductsForList retry with lighter include:", e);
    }
  }

  /* Último intento: sin orderBy custom (p. ej. featured_order faltante) */
  try {
    return await prisma.product.findMany({
      where: args.where,
      take: args.take,
      orderBy: { createdAt: "desc" },
      include: productListIncludeMinimal,
    });
  } catch (e) {
    console.error("[product-queries] findProductsForList failed:", lastError, e);
    throw e;
  }
}
