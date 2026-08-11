import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createEnviopackEnvio,
  createEnviopackPedido,
  isEnviopackConfigured,
} from "@/lib/enviopack";
import { ensureOrderSchema } from "@/lib/order-schema";
import { estimateShippingFromCart } from "@/lib/shipping-packages";
import { resolveEnviopackProvinceId } from "@/lib/shipping-provinces";
import { getShippingSettings, parseShippingAddress } from "@/lib/shipping-zones";

export const dynamic = "force-dynamic";

/** POST — crea pedido + envío en Enviopack para un order con envío a domicilio. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!isEnviopackConfigured()) {
      return NextResponse.json(
        { error: "Enviopack no está configurado (faltan variables de entorno)." },
        { status: 503 }
      );
    }

    await ensureOrderSchema();

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, name: true, phone: true } },
        items: { select: { quantity: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    if (order.deliveryMethod !== "shipping") {
      return NextResponse.json({ error: "Este pedido no es de envío a domicilio." }, { status: 400 });
    }
    if (order.enviopackEnvioId) {
      return NextResponse.json(
        { error: "El envío Enviopack ya fue creado.", enviopackEnvioId: order.enviopackEnvioId },
        { status: 409 }
      );
    }

    const address = order.shippingAddress
      ? parseShippingAddress(JSON.parse(order.shippingAddress))
      : null;
    if (!address) {
      return NextResponse.json({ error: "Dirección de envío inválida." }, { status: 400 });
    }

    const servicio = order.shippingServicio ?? "N";
    const modalidad = order.shippingModalidad ?? "D";
    const packageSummary = estimateShippingFromCart(
      order.items.map((i) => ({ quantity: i.quantity }))
    );

    const shippingSettings = await getShippingSettings();
    const direccionEnvioId = shippingSettings.enviopackDireccionEnvioId ?? undefined;

    let pedidoId = order.enviopackPedidoId;
    if (!pedidoId) {
      const provincia = resolveEnviopackProvinceId(address.state, address.postalCode);
      const pedido = await createEnviopackPedido({
        orderId: order.id,
        recipientName: address.recipientName,
        email: order.user.email,
        phone: order.user.phone,
        total: Number(order.total),
        paid: order.status !== "pending_payment" && order.status !== "cancelled",
        provincia,
        localidad: address.city,
      });
      pedidoId = pedido.id;
    }

    const envio = await createEnviopackEnvio({
      pedidoId,
      address,
      packageSummary,
      servicio,
      modalidad,
      direccionEnvioId,
      confirmado: true,
    });

    const trackingNumber =
      envio.tracking_number?.trim() ||
      (envio.id ? String(envio.id) : null);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        enviopackPedidoId: pedidoId,
        enviopackEnvioId: envio.id,
        trackingNumber,
        shippingCarrier: "Enviopack",
        updatedAt: new Date(),
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: order.status,
        note: `Envío Enviopack creado (#${envio.id}${trackingNumber ? `, tracking ${trackingNumber}` : ""})`,
      },
    });

    return NextResponse.json({
      ok: true,
      order: updated,
      enviopackPedidoId: pedidoId,
      enviopackEnvioId: envio.id,
      trackingNumber,
    });
  } catch (error) {
    console.error("[admin/enviopack/shipment]", error);
    const msg = error instanceof Error ? error.message : "Error al crear envío Enviopack";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
