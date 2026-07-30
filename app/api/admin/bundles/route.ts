import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const bundles = await prisma.product.findMany({
    where: { productType: { in: ["bundle_pack", "bundle_combo"] } },
    orderBy: { name: "asc" },
    include: {
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1 },
      bundleItemsAsParent: {
        orderBy: { sortOrder: "asc" },
        include: {
          component: { select: { id: true, name: true, slug: true, price: true, stock: true } },
        },
      },
    },
  });

  return NextResponse.json(bundles);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const bundleProductId =
    typeof body.bundleProductId === "string" ? body.bundleProductId.trim() : "";
  const productType =
    body.productType === "bundle_combo" ? "bundle_combo" : "bundle_pack";
  const discountPercent =
    body.productType === "bundle_combo"
      ? Math.min(100, Math.max(0, parseInt(String(body.bundleDiscountPercent ?? 0), 10) || 0))
      : null;
  const items = Array.isArray(body.items) ? body.items : [];

  if (!bundleProductId) {
    return NextResponse.json({ error: "Producto bundle requerido" }, { status: 400 });
  }

  const bundle = await prisma.product.findUnique({ where: { id: bundleProductId } });
  if (!bundle) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  type ParsedBundleItem = {
    componentProductId: string;
    quantity: number;
    sortOrder: number;
  };

  const parsedItems: ParsedBundleItem[] = items
    .map((row: Record<string, unknown>, idx: number) => ({
      componentProductId: String(row.componentProductId ?? "").trim(),
      quantity: Math.max(1, parseInt(String(row.quantity ?? 1), 10) || 1),
      sortOrder: idx,
    }))
    .filter(
      (r: ParsedBundleItem) =>
        Boolean(r.componentProductId) && r.componentProductId !== bundleProductId
    );

  if (parsedItems.length === 0) {
    return NextResponse.json({ error: "Agregá al menos un producto al bundle" }, { status: 400 });
  }

  let compareAtPrice: number | null = null;
  if (productType === "bundle_combo") {
    const components = await prisma.product.findMany({
      where: { id: { in: parsedItems.map((i) => i.componentProductId) } },
      select: { id: true, price: true },
    });
    const priceMap = new Map(components.map((c) => [c.id, Number(c.price)]));
    const sum = parsedItems.reduce(
      (s, i) => s + (priceMap.get(i.componentProductId) ?? 0) * i.quantity,
      0
    );
    compareAtPrice = sum;
    if (!body.price) {
      const final = sum * (1 - (discountPercent ?? 0) / 100);
      await prisma.product.update({
        where: { id: bundleProductId },
        data: {
          productType,
          bundleDiscountPercent: discountPercent,
          price: Math.round(final * 100) / 100,
          compareAtPrice: sum,
          useVariants: false,
        },
      });
    }
  }

  await prisma.product.update({
    where: { id: bundleProductId },
    data: {
      productType,
      bundleDiscountPercent: discountPercent,
      useVariants: false,
      ...(body.price != null && body.price !== ""
        ? {
            price: parseFloat(String(body.price)),
            compareAtPrice:
              compareAtPrice ??
              (body.compareAtPrice ? parseFloat(String(body.compareAtPrice)) : null),
          }
        : {}),
    },
  });

  await prisma.bundleItem.deleteMany({ where: { bundleProductId } });
  await prisma.bundleItem.createMany({
    data: parsedItems.map((i) => ({
      bundleProductId,
      componentProductId: i.componentProductId,
      quantity: i.quantity,
      sortOrder: i.sortOrder,
    })),
  });

  const updated = await prisma.product.findUnique({
    where: { id: bundleProductId },
    include: {
      bundleItemsAsParent: {
        orderBy: { sortOrder: "asc" },
        include: { component: { select: { id: true, name: true, price: true, stock: true } } },
      },
    },
  });

  return NextResponse.json(updated);
}
