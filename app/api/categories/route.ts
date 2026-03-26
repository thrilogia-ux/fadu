import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runWithDbRetries } from "@/lib/db-retry";
import { mergeHomeCategories } from "@/lib/home-fallback";

export async function GET() {
  const categories = await runWithDbRetries("api.categories", () =>
    prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
      },
    })
  );

  const list = categories ?? [];
  const simplified = list.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  const safe = mergeHomeCategories(simplified);

  return NextResponse.json(
    safe.map((c, i) => ({
      ...c,
      order: list.find((x) => x.slug === c.slug)?.order ?? i,
    }))
  );
}
