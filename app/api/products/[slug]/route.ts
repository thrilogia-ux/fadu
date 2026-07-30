import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runWithDbRetries } from "@/lib/db-retry";
import { findProductBySlugForApi } from "@/lib/fetch-product-by-slug";
import { serializeProductForApi } from "@/lib/product-api-serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = await runWithDbRetries(`api.products.bySlug.${slug}`, () =>
    findProductBySlugForApi(slug)
  );

  if (product === null) {
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 503 });
  }

  if (!product.active) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  let bundleItems: unknown[] = [];
  if (product.productType === "bundle_pack" || product.productType === "bundle_combo") {
    try {
      bundleItems = await prisma.bundleItem.findMany({
        where: { bundleProductId: product.id },
        orderBy: { sortOrder: "asc" },
        include: {
          component: { select: { id: true, name: true, slug: true, price: true } },
        },
      });
    } catch {
      bundleItems = [];
    }
  }

  return NextResponse.json(serializeProductForApi(product, { bundleItems }));
}
