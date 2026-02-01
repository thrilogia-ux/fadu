import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Obtener productos destacados u ofertas para ordenar
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    if (!type || !["featured", "offers"].includes(type)) {
      return NextResponse.json({ error: "type debe ser featured u offers" }, { status: 400 });
    }

    const orderField = type === "featured" ? "featuredOrder" : "offersOrder";

    const products =
      type === "featured"
        ? await prisma.product.findMany({
            where: { active: true, featured: true },
            orderBy: [{ [orderField]: "asc" }, { createdAt: "desc" }],
            include: {
              category: { select: { name: true } },
              images: { where: { isPrimary: true }, take: 1 },
            },
          })
        : await prisma.product.findMany({
            where: {
              active: true,
              compareAtPrice: { not: null },
            },
            orderBy: [{ [orderField]: "asc" }, { createdAt: "desc" }],
            include: {
              category: { select: { name: true } },
              images: { where: { isPrimary: true }, take: 1 },
            },
          });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching home order products:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

// PATCH - Actualizar orden de productos en Destacados u Ofertas
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { type, productIds } = await request.json();
    if (!type || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere type (featured|offers) y productIds como array" },
        { status: 400 }
      );
    }
    if (!["featured", "offers"].includes(type)) {
      return NextResponse.json({ error: "type debe ser featured o offers" }, { status: 400 });
    }

    const orderField = type === "featured" ? "featuredOrder" : "offersOrder";

    await prisma.$transaction(
      productIds.map((id: string, index: number) =>
        prisma.product.update({
          where: { id },
          data: { [orderField]: index },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating home order:", error);
    return NextResponse.json({ error: "Error al actualizar orden" }, { status: 500 });
  }
}
