import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runWithDbRetries } from "@/lib/db-retry";

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

/**
 * En producción a veces falta la tabla `product_videos` (migración no corrida).
 * Sin este fallback, findUnique con `videos: true` tira y el detalle no abre.
 * Además: mismos reintentos que el listado / home (Vercel ↔ Supabase).
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const wrapped = await runWithDbRetries(`api.products.bySlug.${slug}`, async () => {
    try {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: { ...productIncludeBase, videos: true },
      });
      return { product, withoutVideos: false as const };
    } catch (e) {
      console.error("[api/products/slug] con videos/variantes falló, reintento sin videos:", e);
      try {
        const product = await prisma.product.findUnique({
          where: { slug },
          include: productIncludeBase,
        });
        return { product, withoutVideos: true as const };
      } catch (e2) {
        console.error("[api/products/slug] sin variantes, reintento mínimo:", e2);
        const product = await prisma.product.findUnique({
          where: { slug },
          include: {
            category: { select: { name: true, slug: true } },
            images: { orderBy: { order: "asc" } },
          },
        });
        return {
          product: product
            ? {
                ...product,
                videos: [] as { id: string; url: string | null }[],
                variants: [] as { id: string; sizeLabel: string; colorLabel: string; stock: number; sku: string | null }[],
              }
            : product,
          withoutVideos: true as const,
        };
      }
    }
  });

  if (wrapped === null) {
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 503 });
  }

  const { product, withoutVideos } = wrapped;
  if (!product || !product.active) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const body =
    withoutVideos || !Array.isArray((product as { videos?: unknown }).videos)
      ? { ...product, videos: [] }
      : product;

  return NextResponse.json(body);
}
