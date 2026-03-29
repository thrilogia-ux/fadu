import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type BulkAction = "archive" | "restore" | "delete";

// POST /api/admin/orders/bulk — Archivar, restaurar o eliminar pedidos en lote
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string" && x.length > 0) : [];
    const action = body?.action as BulkAction;

    if (ids.length === 0) {
      return NextResponse.json({ error: "Seleccioná al menos un pedido" }, { status: 400 });
    }

    if (!["archive", "restore", "delete"].includes(action)) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    if (action === "delete") {
      const result = await prisma.order.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ ok: true, action: "delete", count: result.count });
    }

    if (action === "archive") {
      const result = await prisma.order.updateMany({
        where: { id: { in: ids } },
        data: { archived: true },
      });
      return NextResponse.json({ ok: true, action: "archive", count: result.count });
    }

    const result = await prisma.order.updateMany({
      where: { id: { in: ids } },
      data: { archived: false },
    });
    return NextResponse.json({ ok: true, action: "restore", count: result.count });
  } catch (error) {
    console.error("Error bulk orders:", error);
    return NextResponse.json({ error: "Error al procesar pedidos" }, { status: 500 });
  }
}
