import { prisma } from "@/lib/prisma";

const productIncludeBase = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { order: "asc" as const } },
  variants: {
    orderBy: [{ sizeLabel: "asc" as const }, { colorLabel: "asc" as const }],
    select: {
      id: true,
      sizeLabel: true,
      colorLabel: true,
      stock: true,
      sku: true,
    },
  },
};

const productIncludeMinimal = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { order: "asc" as const } },
};

/**
 * Consulta progresiva: primero sin videos (más liviana y estable en serverless).
 */
export async function findProductBySlugForApi(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: productIncludeBase,
    });
    if (product) return product;
    return null;
  } catch (e) {
    console.error("[products/slug] consulta base falló:", e);
  }

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: productIncludeMinimal,
    });
    if (!product) return null;
    return {
      ...product,
      variants: [] as {
        id: string;
        sizeLabel: string;
        colorLabel: string;
        stock: number;
        sku: string | null;
      }[],
    };
  } catch (e2) {
    console.error("[products/slug] consulta mínima falló:", e2);
    throw e2;
  }
}
