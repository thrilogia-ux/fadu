import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendPickupReadyEmail, sendOrderShippedEmail } from "@/lib/email";
import { getPickupInfo } from "@/lib/pickup";
import { buildPickupReadyNotifyUrl, buildShippedNotifyUrl } from "@/lib/whatsapp";
import { getWhatsAppSettings } from "@/lib/whatsapp-settings";
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
      "shipped",
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
        deliveryMethod: true,
        pickupCode: true,
        trackingNumber: true,
        shippingCarrier: true,
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
    let shippedEmailSent: boolean | undefined;
    let shippedEmailError: string | undefined;
    let pickupWhatsAppNotifyUrl: string | null = null;
    let shippedWhatsAppNotifyUrl: string | null = null;
    const waSettings = await getWhatsAppSettings();
    if (
      status === "ready_for_pickup" &&
      existing.status !== "ready_for_pickup" &&
      existing.deliveryMethod !== "shipping"
    ) {
      const fullOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: { include: { product: { select: { name: true } } } },
          user: { select: { email: true, name: true, phone: true, whatsappNotify: true } },
        },
      });
      if (fullOrder?.pickupCode) {
        const pickup = await getPickupInfo();
        if (
          waSettings.notifyOnPickupReady &&
          fullOrder.user.phone &&
          fullOrder.user.whatsappNotify
        ) {
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

    if (status === "shipped" && existing.status !== "shipped" && existing.deliveryMethod === "shipping") {
      const fullOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { email: true, name: true, phone: true, whatsappNotify: true } },
        },
      });
      if (fullOrder) {
        if (
          waSettings.notifyOnShipped &&
          fullOrder.user.phone &&
          fullOrder.user.whatsappNotify &&
          fullOrder.pickupCode
        ) {
          shippedWhatsAppNotifyUrl = buildShippedNotifyUrl(fullOrder.user.phone, {
            customerName: fullOrder.user.name,
            pickupCode: fullOrder.pickupCode,
            orderId: fullOrder.id,
            trackingNumber: fullOrder.trackingNumber,
            shippingCarrier: fullOrder.shippingCarrier,
          });
        }
        try {
          const emailResult = await sendOrderShippedEmail({
            id: fullOrder.id,
            pickupCode: fullOrder.pickupCode,
            trackingNumber: fullOrder.trackingNumber,
            shippingCarrier: fullOrder.shippingCarrier,
            user: fullOrder.user,
          });
          shippedEmailSent = emailResult.ok;
          if (!emailResult.ok) {
            shippedEmailError = emailResult.error;
            console.error("[admin/order/status] sendOrderShippedEmail:", emailResult.error, "orderId", id);
          }
        } catch (e) {
          shippedEmailSent = false;
          shippedEmailError = e instanceof Error ? e.message : String(e);
        }
      }
    }

    return NextResponse.json({
      order,
      pickupReadyEmailSent,
      pickupReadyEmailError,
      shippedEmailSent,
      shippedEmailError,
      pickupWhatsAppNotifyUrl,
      shippedWhatsAppNotifyUrl,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}
