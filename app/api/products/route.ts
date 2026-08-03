import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runWithDbRetries } from "@/lib/db-retry";
import { homeFeaturedOrderBy, homeOffersOrderBy } from "@/lib/product-list-order";
import { findProductsForList } from "@/lib/product-queries";

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

  if (!q?.trim() && categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (category) where.categoryId = category.id;
  }

  const orderBy =
    !q?.trim() && featured === "true"
      ? homeFeaturedOrderBy
      : !q?.trim() && searchParams.get("onSale") === "true"
        ? homeOffersOrderBy
        : { createdAt: "desc" as const };

  const listArgs = { where, take: limit, orderBy };

  let products = await runWithDbRetries("api.products.list", () => findProductsForList(listArgs));

  if (products === null) {
    try {
      products = await findProductsForList({
        ...listArgs,
        orderBy: { createdAt: "desc" },
      });
    } catch (e) {
      console.error("[api/products] direct fallback failed:", e);
      products = [];
    }
  }

  return NextResponse.json(products ?? []);
}
