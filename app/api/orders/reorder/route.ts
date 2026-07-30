import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { productInStock } from "@/lib/product-stock";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Iniciá sesión para repetir el pedido" }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (typeof orderId !== "string" || !orderId.trim()) {
      return NextResponse.json({ error: "Pedido requerido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId.trim() },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                variants: {
                  select: {
                    id: true,
                    stock: true,
                    sizeLabel: true,
                    colorLabel: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const items = order.items.map((line) => {
      const p = line.product;
      if (!p || !p.active || !line.productId) {
        return {
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
          product: p,
          available: false,
          reason: "Producto no disponible",
        };
      }

      let available = productInStock({
        stock: p.stock,
        useVariants: p.useVariants,
        variants: p.variants,
      });

      if (p.useVariants && line.variantId) {
        const v = p.variants.find((x) => x.id === line.variantId);
        available = Boolean(v && v.stock >= line.quantity);
      } else if (!p.useVariants) {
        available = p.stock >= line.quantity;
      }

      return {
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        variantSizeLabel: line.variantSizeLabel,
        variantColorLabel: line.variantColorLabel,
        product: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          active: p.active,
          stock: p.stock,
          useVariants: p.useVariants,
          images: p.images,
          variants: p.variants,
        },
        available,
        reason: available ? undefined : "Sin stock suficiente",
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[orders/reorder]", error);
    return NextResponse.json({ error: "Error al preparar recompra" }, { status: 500 });
  }
}
