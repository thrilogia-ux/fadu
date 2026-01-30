import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// PATCH /api/admin/orders/[id]/status - Cambiar estado del pedido
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { status, note } = await request.json();

    if (!status) {
      return NextResponse.json({ error: "Estado requerido" }, { status: 400 });
    }

    const validStatuses = [
      "pending_payment",
      "paid",
      "preparing",
      "ready_for_pickup",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    // Actualizar estado del pedido
    const order = await prisma.order.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    // Registrar en historial
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        note: note || null,
      },
    });

    // TODO: Si el estado es ready_for_pickup, enviar email con QR

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}
