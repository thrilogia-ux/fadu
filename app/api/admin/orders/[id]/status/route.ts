import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendPickupReadyEmail } from "@/lib/email";
import { getPickupInfo } from "@/lib/pickup";
import { buildPickupReadyNotifyUrl } from "@/lib/whatsapp";
import { buildPaidOrderUpdate } from "@/lib/finance-order";
import { ensureFinanceSchema } from "@/lib/finance-schema";

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

    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        archived: true,
        paymentMethod: true,
        total: true,
        paidAt: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    if (existing.archived) {
      return NextResponse.json(
        { error: "El pedido está archivado. Restaurarlo antes de cambiar el estado." },
        { status: 400 }
      );
    }

    await ensureFinanceSchema();

    const updateData: {
      status: string;
      updatedAt: Date;
      paidAt?: Date;
      platformFee?: number | null;
      netReceived?: number | null;
    } = { status, updatedAt: new Date() };

    const shouldMarkPaid =
      status === "paid" && existing.status === "pending_payment" && !existing.paidAt;

    if (shouldMarkPaid) {
      const paidUpdate = await buildPaidOrderUpdate(
        existing.paymentMethod,
        Number(existing.total)
      );
      updateData.paidAt = paidUpdate.paidAt;
      updateData.platformFee = paidUpdate.platformFee;
      updateData.netReceived = paidUpdate.netReceived;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        note: note || null,
      },
    });

    let pickupReadyEmailSent: boolean | undefined;
    let pickupReadyEmailError: string | undefined;
    let pickupWhatsAppNotifyUrl: string | null = null;
    if (
      status === "ready_for_pickup" &&
      existing.status !== "ready_for_pickup"
    ) {
      const fullOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: { include: { product: { select: { name: true } } } },
          user: { select: { email: true, name: true, phone: true } },
        },
      });
      if (fullOrder?.pickupCode) {
        const pickup = await getPickupInfo();
        if (fullOrder.user.phone) {
          pickupWhatsAppNotifyUrl = buildPickupReadyNotifyUrl(fullOrder.user.phone, {
            customerName: fullOrder.user.name,
            pickupCode: fullOrder.pickupCode,
            orderId: fullOrder.id,
            address: pickup.address,
            scheduleLines: pickup.scheduleLines,
          });
        }

        try {
          const orderForEmail = {
            ...fullOrder,
            total: Number(fullOrder.total),
            discountTotal: Number(fullOrder.discountTotal ?? 0),
            items: fullOrder.items.map((i) => ({
              quantity: i.quantity,
              price: Number(i.price),
              product: i.product,
            })),
          };
          const emailResult = await sendPickupReadyEmail(orderForEmail);
          pickupReadyEmailSent = emailResult.ok;
          if (!emailResult.ok) {
            pickupReadyEmailError = emailResult.error;
            console.error(
              "[admin/order/status] sendPickupReadyEmail:",
              emailResult.error,
              "orderId",
              id
            );
          }
        } catch (e) {
          console.error("[admin/order/status] error enviando email listo para retiro:", e);
          pickupReadyEmailSent = false;
          pickupReadyEmailError = e instanceof Error ? e.message : String(e);
        }
      } else {
        pickupReadyEmailSent = false;
        pickupReadyEmailError = "Pedido sin código de retiro";
      }
    }

    return NextResponse.json({
      order,
      pickupReadyEmailSent,
      pickupReadyEmailError,
      pickupWhatsAppNotifyUrl,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}
