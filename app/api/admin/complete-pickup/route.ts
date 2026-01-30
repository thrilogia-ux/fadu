import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST /api/admin/complete-pickup - Marcar pedido como completado (retirado)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { orderId, pickedUpBy, pickedUpDni } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "ID de pedido requerido" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "completed",
        pickupDate: new Date(),
        pickedUpBy: pickedUpBy || null,
        pickedUpDni: pickedUpDni || null,
        validatedBy: session.user.email || null,
        validatedAt: new Date(),
      },
    });

    // Registrar en historial
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "completed",
        note: `Retirado por: ${pickedUpBy || "N/A"}${pickedUpDni ? ` (DNI: ${pickedUpDni})` : ""}`,
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Error completing pickup:", error);
    return NextResponse.json({ error: "Error al completar retiro" }, { status: 500 });
  }
}
