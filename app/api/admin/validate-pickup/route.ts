import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST /api/admin/validate-pickup - Validar código y obtener pedido
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { pickupCode } = await request.json();

    if (!pickupCode || typeof pickupCode !== "string") {
      return NextResponse.json({ error: "Código de retiro requerido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { pickupCode: pickupCode.trim().toUpperCase() },
      include: {
        user: { select: { email: true, name: true } },
        items: {
          include: {
            product: { select: { name: true, images: { where: { isPrimary: true }, take: 1 } } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    if (order.status !== "ready_for_pickup") {
      return NextResponse.json(
        { error: `El pedido no está listo para retirar (estado: ${order.status})` },
        { status: 400 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error validating pickup:", error);
    return NextResponse.json({ error: "Error al validar código" }, { status: 500 });
  }
}
