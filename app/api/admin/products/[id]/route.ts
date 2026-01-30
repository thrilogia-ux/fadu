import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    // Actualizar producto
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        stock: parseInt(stock) || 0,
        sku: sku || null,
        categoryId,
        featured: featured ?? false,
        active: active ?? true,
      },
    });

    // Actualizar imágenes si se proporcionaron
    if (images !== undefined) {
      // Eliminar imágenes existentes
      await prisma.productImage.deleteMany({ where: { productId: id } });
      // Crear nuevas
      if (images?.length) {
        await prisma.productImage.createMany({
          data: images.map((img: { url: string; isPrimary?: boolean }, idx: number) => ({
            productId: id,
            url: img.url,
            order: idx,
            isPrimary: img.isPrimary ?? idx === 0,
          })),
        });
      }
    }

    // Actualizar videos si se proporcionaron
    if (videos !== undefined) {
      // Eliminar videos existentes
      await prisma.productVideo.deleteMany({ where: { productId: id } });
      // Crear nuevos
      if (videos?.length) {
        await prisma.productVideo.createMany({
          data: videos.map((url: string) => ({
            productId: id,
            url,
            type: "url",
          })),
        });
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { order: "asc" } },
        videos: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
