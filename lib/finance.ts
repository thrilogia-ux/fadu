import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/finance-schema";
import type { FinanceSummary } from "@/lib/finance-display";

export type { FinanceSummary } from "@/lib/finance-display";

/** Pedidos de prueba admin — excluidos de reportes financieros */
export const FINANCE_EXCLUDED_PAYMENT_METHODS = ["test"] as const;

/** Estados que implican cobro confirmado (si no hay paidAt legacy) */
export const COLLECTED_STATUSES = ["paid", "preparing", "ready_for_pickup", "completed"] as const;

export function monthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { start, end };
}

export function effectivePaidAt(order: {
  paidAt: Date | null;
  createdAt: Date;
  status: string;
  paymentMethod: string | null;
}): Date | null {
  if (FINANCE_EXCLUDED_PAYMENT_METHODS.includes(order.paymentMethod as "test")) {
    return null;
  }
  if (order.paidAt) return order.paidAt;
  if (order.status === "cancelled" || order.status === "pending_payment") return null;
  if (COLLECTED_STATUSES.includes(order.status as (typeof COLLECTED_STATUSES)[number])) {
    return order.createdAt;
  }
  return null;
}

export function isOrderCollected(order: {
  paidAt: Date | null;
  status: string;
  paymentMethod: string | null;
  createdAt: Date;
}): boolean {
  return effectivePaidAt(order) !== null;
}

function sumItemsCogs(
  items: { quantity: number; unitCostSnapshot: { toNumber?: () => number } | number | null }[]
): number {
  return items.reduce((acc, item) => {
    const cost =
      item.unitCostSnapshot == null
        ? 0
        : typeof item.unitCostSnapshot === "number"
          ? item.unitCostSnapshot
          : Number(item.unitCostSnapshot);
    return acc + cost * item.quantity;
  }, 0);
}

export async function getFinanceSummary(year: number, month: number): Promise<FinanceSummary> {
  await ensureFinanceSchema();

  const { start, end } = monthRange(year, month);

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        archived: false,
        paymentMethod: { notIn: [...FINANCE_EXCLUDED_PAYMENT_METHODS] },
      },
      include: {
        items: {
          select: { quantity: true, unitCostSnapshot: true },
        },
      },
    }),
    prisma.financialExpense.findMany({
      where: { year, month },
      include: { category: { select: { id: true, name: true } } },
    }),
  ]);

  let collectedTotal = 0;
  let pendingTotal = 0;
  let discountsTotal = 0;
  let platformFeesTotal = 0;
  let cogsTotal = 0;
  let invoicedTotal = 0;
  let orderCountCollected = 0;
  let orderCountPending = 0;
  let itemsWithoutCost = 0;
  let collectedWithoutInvoice = 0;
  const byPaymentMethod: Record<string, { count: number; total: number; fees: number }> = {};

  for (const order of orders) {
    const total = Number(order.total);
    const discount = Number(order.discountTotal ?? 0);
    const paidAt = effectivePaidAt(order);
    const inMonth = paidAt && paidAt >= start && paidAt < end;

    if (order.status === "pending_payment" && !order.paidAt) {
      pendingTotal += total;
      orderCountPending += 1;
      continue;
    }

    if (!inMonth) continue;

    orderCountCollected += 1;
    collectedTotal += total;
    discountsTotal += discount;
    platformFeesTotal += Number(order.platformFee ?? 0);
    cogsTotal += sumItemsCogs(order.items);

    for (const item of order.items) {
      if (item.unitCostSnapshot == null) itemsWithoutCost += item.quantity;
    }

    const method = order.paymentMethod || "unknown";
    if (!byPaymentMethod[method]) {
      byPaymentMethod[method] = { count: 0, total: 0, fees: 0 };
    }
    byPaymentMethod[method].count += 1;
    byPaymentMethod[method].total += total;
    byPaymentMethod[method].fees += Number(order.platformFee ?? 0);

    if (order.invoiceAmount != null) {
      invoicedTotal += Number(order.invoiceAmount);
    } else if (order.invoicedAt) {
      invoicedTotal += total;
    }

    if (!order.invoiceNumber && !order.invoicedAt) {
      collectedWithoutInvoice += 1;
    }
  }

  const expensesByCategoryMap = new Map<string, { categoryId: string; categoryName: string; total: number }>();
  let expensesTotal = 0;
  for (const exp of expenses) {
    const amount = Number(exp.amount);
    expensesTotal += amount;
    const existing = expensesByCategoryMap.get(exp.categoryId);
    if (existing) {
      existing.total += amount;
    } else {
      expensesByCategoryMap.set(exp.categoryId, {
        categoryId: exp.categoryId,
        categoryName: exp.category.name,
        total: amount,
      });
    }
  }

  const grossMargin = collectedTotal - cogsTotal - platformFeesTotal;
  const netResult = grossMargin - expensesTotal;
  const reconciliationDiff = collectedTotal - invoicedTotal;

  return {
    year,
    month,
    collectedTotal,
    pendingTotal,
    discountsTotal,
    platformFeesTotal,
    cogsTotal,
    grossMargin,
    expensesTotal,
    netResult,
    invoicedTotal,
    reconciliationDiff,
    orderCountCollected,
    orderCountPending,
    itemsWithoutCost,
    collectedWithoutInvoice,
    byPaymentMethod,
    expensesByCategory: [...expensesByCategoryMap.values()].sort((a, b) => b.total - a.total),
  };
}
