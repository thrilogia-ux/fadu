import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

let ensured = false;

/** Prisma usa la tabla "Product" (sin @@map). Algunos scripts viejos usaban "products". */
const PRODUCT_TABLE_NAMES = ["Product", "products"] as const;

const PRODUCT_COLUMN_DEFS: { name: string; ddl: string }[] = [
  { name: "cost_price", ddl: `DECIMAL(10, 2)` },
  { name: "featured_order", ddl: `INTEGER` },
  { name: "offers_order", ddl: `INTEGER` },
  { name: "use_variants", ddl: `BOOLEAN NOT NULL DEFAULT false` },
  { name: "show_size_selector", ddl: `BOOLEAN NOT NULL DEFAULT false` },
  { name: "show_color_selector", ddl: `BOOLEAN NOT NULL DEFAULT false` },
  { name: "product_type", ddl: `TEXT NOT NULL DEFAULT 'standard'` },
  { name: "bundle_discount_percent", ddl: `INTEGER` },
];

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${tableName}
    ) AS "exists"
  `;
  return Boolean(rows[0]?.exists);
}

export async function ensureProductSchema(): Promise<void> {
  if (ensured) return;
  try {
    for (const tableName of PRODUCT_TABLE_NAMES) {
      if (!(await tableExists(tableName))) continue;
      const quoted = `"${tableName}"`;
      for (const col of PRODUCT_COLUMN_DEFS) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE ${quoted} ADD COLUMN IF NOT EXISTS "${col.name}" ${col.ddl}`
        );
      }
    }

    if (await tableExists("product_reviews")) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "product_reviews" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending'`
      );
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

  const attempts: Array<
    | typeof productListIncludeFull
    | typeof productListIncludeWithVariants
    | typeof productListIncludeMinimal
  > = [productListIncludeFull, productListIncludeWithVariants, productListIncludeMinimal];

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

/**
 * Conteo rápido para diagnóstico (health / debug).
 */
export async function countActiveProducts(): Promise<number | null> {
  try {
    await ensureProductSchema();
    return await prisma.product.count({ where: { active: true } });
  } catch {
    return null;
  }
}
