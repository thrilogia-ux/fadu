import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/finance-schema";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await ensureFinanceSchema();
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? "0", 10);
  const month = parseInt(searchParams.get("month") ?? "0", 10);

  const where =
    year > 0 && month >= 1 && month <= 12 ? { year, month } : {};

  const expenses = await prisma.financialExpense.findMany({
    where,
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await ensureFinanceSchema();
  const body = await request.json();

  const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : "";
  const amount = parseFloat(String(body.amount ?? ""));
  const expenseDateStr = typeof body.expenseDate === "string" ? body.expenseDate : "";
  const expenseDate = expenseDateStr ? new Date(expenseDateStr) : new Date();

  if (!categoryId || !description || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const year = expenseDate.getFullYear();
  const month = expenseDate.getMonth() + 1;

  const expense = await prisma.financialExpense.create({
    data: {
      categoryId,
      description,
      amount,
      expenseDate,
      year,
      month,
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(expense);
}
