import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runWithDbRetries } from "@/lib/db-retry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured");
  const categorySlug = searchParams.get("category");
  const q = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const excludeSlug = searchParams.get("excludeSlug")?.trim() || undefined;

  const where: {
    active: boolean;
    slug?: { not: string };
    featured?: boolean;
    categoryId?: string;
    compareAtPrice?: { not: null };
    OR?: {
      name?: { contains: string; mode: "insensitive" };
      description?: { contains: string; mode: "insensitive" };
    }[];
  } = { active: true };

  if (excludeSlug) {
    where.slug = { not: excludeSlug };
  }

  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  } else {
    if (featured === "true") where.featured = true;
    if (searchParams.get("onSale") === "true") {
      where.compareAtPrice = { not: null };
    }
  }

  const products = await runWithDbRetries("api.products.list", async () => {
    if (!q?.trim() && categorySlug) {
      const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (category) where.categoryId = category.id;
    }
    return prisma.product.findMany({
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
  });

  /* Lista vacía mejor que 500: la tienda sigue navegable ante fallos puntuales */
  return NextResponse.json(products ?? []);
}
