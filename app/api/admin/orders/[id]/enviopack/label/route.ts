import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEnviopackLabelPdf, isEnviopackConfigured } from "@/lib/enviopack";
import { ensureOrderSchema } from "@/lib/order-schema";

export const dynamic = "force-dynamic";

/** GET — descarga etiqueta PDF de Enviopack. */
export async function GET(
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
      return NextResponse.json({ error: "Enviopack no configurado." }, { status: 503 });
    }

    await ensureOrderSchema();

    const order = await prisma.order.findUnique({
      where: { id },
      select: { enviopackEnvioId: true, pickupCode: true },
    });

    if (!order?.enviopackEnvioId) {
      return NextResponse.json(
        { error: "Este pedido no tiene envío Enviopack. Creá el envío primero." },
        { status: 400 }
      );
    }

    const pdf = await getEnviopackLabelPdf(order.enviopackEnvioId);
    const code = order.pickupCode || order.enviopackEnvioId;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="etiqueta-${code}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[admin/enviopack/label]", error);
    const msg = error instanceof Error ? error.message : "Error al obtener etiqueta";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
