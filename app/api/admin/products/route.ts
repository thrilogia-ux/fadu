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
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
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
    } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "Nombre, precio y categoría son requeridos" },
        { status: 400 }
      );
    }

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
        stock: parseInt(stock) || 0,
        sku: sku || null,
        categoryId,
        featured: featured ?? false,
        active: active ?? true,
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
      },
      include: {
        category: { select: { name: true } },
        images: true,
        videos: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
