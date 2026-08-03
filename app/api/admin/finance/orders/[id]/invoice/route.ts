import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/finance-schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await ensureFinanceSchema();
  const body = await request.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const data: {
    invoiceNumber?: string | null;
    invoiceAmount?: number | null;
    invoicedAt?: Date | null;
  } = {};

  if (body.invoiceNumber !== undefined) {
    data.invoiceNumber =
      typeof body.invoiceNumber === "string" && body.invoiceNumber.trim()
        ? body.invoiceNumber.trim().slice(0, 40)
        : null;
  }

  if (body.invoiceAmount !== undefined) {
    if (body.invoiceAmount === null || body.invoiceAmount === "") {
      data.invoiceAmount = null;
    } else {
      const amount = parseFloat(String(body.invoiceAmount));
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ error: "Monto facturado inválido" }, { status: 400 });
      }
      data.invoiceAmount = amount;
    }
  }

  if (body.invoicedAt !== undefined) {
    if (body.invoicedAt === null || body.invoicedAt === "") {
      data.invoicedAt = null;
    } else {
      const d = new Date(body.invoicedAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Fecha de factura inválida" }, { status: 400 });
      }
      data.invoicedAt = d;
    }
  }

  if (data.invoiceNumber && !data.invoicedAt) {
    data.invoicedAt = new Date();
  }

  const updated = await prisma.order.update({ where: { id }, data });
  return NextResponse.json(updated);
}
