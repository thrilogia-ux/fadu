import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/finance-schema";
import { effectivePaidAt, FINANCE_EXCLUDED_PAYMENT_METHODS, monthRange } from "@/lib/finance";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await ensureFinanceSchema();
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1), 10);
  const { start, end } = monthRange(year, month);

  const orders = await prisma.order.findMany({
    where: {
      archived: false,
      paymentMethod: { notIn: [...FINANCE_EXCLUDED_PAYMENT_METHODS] },
      status: { not: "cancelled" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      pickupCode: true,
      status: true,
      paymentMethod: true,
      total: true,
      paidAt: true,
      createdAt: true,
      invoiceNumber: true,
      invoiceAmount: true,
      invoicedAt: true,
      user: { select: { email: true, name: true } },
    },
  });

  const inMonth = orders.filter((o) => {
    const paid = effectivePaidAt(o);
    return paid && paid >= start && paid < end;
  });

  return NextResponse.json(inMonth);
}
