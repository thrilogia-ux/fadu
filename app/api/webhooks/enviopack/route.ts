import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureOrderSchema } from "@/lib/order-schema";

export const dynamic = "force-dynamic";

type WebhookPayload = {
  id?: number | string;
  envio?: number | string;
  envio_id?: number | string;
  tracking_number?: string;
  numero_seguimiento?: string;
  estado?: string;
  condicion?: string;
  mensaje?: string;
};

function parseEnvioId(body: WebhookPayload): number | null {
  const raw = body.envio ?? body.envio_id ?? body.id;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseTracking(body: WebhookPayload): string | null {
  const t = body.tracking_number ?? body.numero_seguimiento;
  return typeof t === "string" && t.trim() ? t.trim() : null;
}

/** POST — webhook Enviopack (envio-cambio-condicion u otros eventos de envío). */
export async function POST(request: Request) {
  try {
    const secret = process.env.ENVOIPACK_WEBHOOK_SECRET?.trim();
    if (secret) {
      const headerSecret =
        request.headers.get("x-enviopack-secret") ??
        request.headers.get("x-webhook-secret");
      if (headerSecret !== secret) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    let body: WebhookPayload;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const envioId = parseEnvioId(body);
    if (!envioId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    await ensureOrderSchema();

    const order = await prisma.order.findFirst({
      where: { enviopackEnvioId: envioId },
      select: { id: true, status: true, trackingNumber: true },
    });

    if (!order) {
      return NextResponse.json({ ok: true, ignored: true, envioId });
    }

    const tracking = parseTracking(body);
    const estado = (body.estado ?? body.condicion ?? "").toString().toLowerCase();
    const noteParts = [body.mensaje, estado ? `Estado: ${estado}` : null].filter(Boolean);

    const updateData: {
      trackingNumber?: string;
      status?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (tracking && tracking !== order.trackingNumber) {
      updateData.trackingNumber = tracking;
    }

    const shippedHints = ["transito", "tránsito", "despachado", "en camino", "entregado"];
    if (
      shippedHints.some((h) => estado.includes(h)) &&
      order.status === "preparing"
    ) {
      updateData.status = "shipped";
    }

    if (Object.keys(updateData).length > 1) {
      await prisma.order.update({
        where: { id: order.id },
        data: updateData,
      });
    }

    if (noteParts.length > 0) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: updateData.status ?? order.status,
          note: `Webhook Enviopack: ${noteParts.join(" — ")}`,
        },
      });
    }

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (error) {
    console.error("[webhooks/enviopack]", error);
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 });
  }
}
