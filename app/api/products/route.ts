import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const categorySlug = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const where: any = { active: true };
    if (featured === "true") where.featured = true;
    if (categorySlug) {
      const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (category) where.categoryId = category.id;
    }

    const products = await prisma.product.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}
