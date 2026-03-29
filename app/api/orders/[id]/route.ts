import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario sea el dueño o admin
    const isAdmin = (session?.user as any)?.role === "admin";
    if (session?.user?.id !== order.userId && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (order.archived && !isAdmin) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Error al obtener pedido" }, { status: 500 });
  }
}
