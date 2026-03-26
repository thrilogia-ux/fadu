import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const productIncludeBase = {
  category: { select: { name: true, slug: true } as const },
  images: { orderBy: { order: "asc" as const } },
} as const;

/**
 * En producción a veces falta la tabla `product_videos` (migración no corrida).
 * Sin este fallback, findUnique con `videos: true` tira 500 y el detalle no abre.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { ...productIncludeBase, videos: true },
    });

    if (!product || !product.active) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (e) {
    console.error("[api/products/slug] con videos falló, reintento sin videos:", e);
    try {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: productIncludeBase,
      });

      if (!product || !product.active) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }

      return NextResponse.json({ ...product, videos: [] });
    } catch (e2) {
      console.error("Error fetching product:", e2);
      return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 });
    }
  }
}
