export type FinanceSummary = {
  year: number;
  month: number;
  collectedTotal: number;
  pendingTotal: number;
  discountsTotal: number;
  platformFeesTotal: number;
  cogsTotal: number;
  grossMargin: number;
  expensesTotal: number;
  netResult: number;
  invoicedTotal: number;
  reconciliationDiff: number;
  orderCountCollected: number;
  orderCountPending: number;
  itemsWithoutCost: number;
  collectedWithoutInvoice: number;
  byPaymentMethod: Record<string, { count: number; total: number; fees: number }>;
  expensesByCategory: { categoryId: string; categoryName: string; total: number }[];
};

export function formatPaymentMethodLabel(method: string | null): string {
  const labels: Record<string, string> = {
    mercadopago: "Mercado Pago",
    transfer: "Transferencia",
    feria_presencial: "Feria presencial",
    test: "Prueba (admin)",
  };
  return labels[method ?? ""] || method || "—";
}

export function formatMoney(n: number): string {
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
