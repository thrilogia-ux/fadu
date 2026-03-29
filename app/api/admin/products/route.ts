import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { order: "asc" } },
        videos: true,
        variants: { orderBy: [{ sizeLabel: "asc" }, { colorLabel: "asc" }] },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

function parseVariantsFromBody(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((row: Record<string, unknown>) => ({
    sizeLabel: typeof row.sizeLabel === "string" ? row.sizeLabel.trim() : "",
    colorLabel: typeof row.colorLabel === "string" ? row.colorLabel.trim() : "",
    stock: Math.max(0, parseInt(String(row.stock ?? 0), 10) || 0),
    sku:
      row.sku != null && String(row.sku).trim()
        ? String(row.sku).trim().slice(0, 120)
        : null,
  }));
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      compareAtPrice,
      stock,
      sku,
      categoryId,
      featured,
      active,
      images,
      videos,
      useVariants,
      showSizeSelector,
      showColorSelector,
      variants: variantsBody,
    } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "Nombre, precio y categoría son requeridos" },
        { status: 400 }
      );
    }

    const useV = Boolean(useVariants);
    const variants = parseVariantsFromBody(variantsBody);
    if (useV && variants.length === 0) {
      return NextResponse.json(
        { error: "Con variantes activadas, cargá al menos una fila de talle/color y stock" },
        { status: 400 }
      );
    }

    const stockTotal = useV
      ? variants.reduce((s, v) => s + v.stock, 0)
      : parseInt(String(stock), 10) || 0;

    // Generar slug único
    let slug = generateSlug(name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        stock: stockTotal,
        sku: sku || null,
        categoryId,
        featured: featured ?? false,
        active: active ?? true,
        useVariants: useV,
        showSizeSelector: Boolean(showSizeSelector),
        showColorSelector: Boolean(showColorSelector),
        images: images?.length
          ? {
              create: images.map((img: { url: string; isPrimary?: boolean }, idx: number) => ({
                url: img.url,
                order: idx,
                isPrimary: img.isPrimary ?? idx === 0,
              })),
            }
          : undefined,
        videos: videos?.length
          ? {
              create: videos.map((url: string) => ({
                url,
                type: "url",
              })),
            }
          : undefined,
        variants:
          useV && variants.length
            ? {
                create: variants.map((v) => ({
                  sizeLabel: v.sizeLabel,
                  colorLabel: v.colorLabel,
                  stock: v.stock,
                  sku: v.sku,
                })),
              }
            : undefined,
      },
      include: {
        category: { select: { name: true } },
        images: true,
        videos: true,
        variants: { orderBy: [{ sizeLabel: "asc" }, { colorLabel: "asc" }] },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
