import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
      useVariants,
      showSizeSelector,
      showColorSelector,
      variants: variantsBody,
    } = body;

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

    // Actualizar producto
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
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
      },
    });

    if (variantsBody !== undefined) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      if (useV && variants.length) {
        await prisma.productVariant.createMany({
          data: variants.map((v) => ({
            productId: id,
            sizeLabel: v.sizeLabel,
            colorLabel: v.colorLabel,
            stock: v.stock,
            sku: v.sku,
          })),
        });
      }
    }

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
        variants: { orderBy: [{ sizeLabel: "asc" }, { colorLabel: "asc" }] },
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
