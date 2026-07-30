import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateQRBuffer } from "@/lib/qr";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, pickupCode: true, archived: true },
    });

    if (!order?.pickupCode) {
      return NextResponse.json({ error: "Pedido sin código de retiro" }, { status: 404 });
    }

    const isAdmin = (session.user as { role?: string }).role === "admin";
    if (order.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (order.archived && !isAdmin) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const buffer = await generateQRBuffer(order.pickupCode);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="fadu-${order.pickupCode}.png"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[orders/qr]", error);
    return NextResponse.json({ error: "No se pudo generar el QR" }, { status: 500 });
  }
}
