import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/finance-schema";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await ensureFinanceSchema();
  await prisma.financialExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

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

  const existing = await prisma.financialExpense.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
  }

  const data: {
    categoryId?: string;
    description?: string;
    amount?: number;
    expenseDate?: Date;
    year?: number;
    month?: number;
  } = {};

  if (typeof body.categoryId === "string") data.categoryId = body.categoryId;
  if (typeof body.description === "string") data.description = body.description.trim().slice(0, 500);
  if (body.amount != null) {
    const amount = parseFloat(String(body.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }
    data.amount = amount;
  }
  if (typeof body.expenseDate === "string") {
    const expenseDate = new Date(body.expenseDate);
    data.expenseDate = expenseDate;
    data.year = expenseDate.getFullYear();
    data.month = expenseDate.getMonth() + 1;
  }

  const expense = await prisma.financialExpense.update({
    where: { id },
    data,
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(expense);
}
