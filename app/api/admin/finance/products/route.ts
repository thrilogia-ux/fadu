import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/finance-schema";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await ensureFinanceSchema();

  const products = await prisma.product.findMany({
    where: { active: true, productType: "standard" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      costPrice: true,
      category: { select: { name: true } },
    },
  });

  return NextResponse.json(products);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await ensureFinanceSchema();
  const body = await request.json();
  const updates = Array.isArray(body.updates) ? body.updates : [];

  if (updates.length === 0) {
    return NextResponse.json({ error: "Sin actualizaciones" }, { status: 400 });
  }

  let updated = 0;
  for (const row of updates) {
    if (!row || typeof row.id !== "string") continue;
    const costRaw = row.costPrice;
    const costPrice =
      costRaw === null || costRaw === ""
        ? null
        : parseFloat(String(costRaw));
    if (costPrice !== null && (!Number.isFinite(costPrice) || costPrice < 0)) continue;

    await prisma.product.update({
      where: { id: row.id },
      data: { costPrice },
    });
    updated += 1;
  }

  return NextResponse.json({ updated });
}
