"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPaymentMethodLabel, formatMoney, type FinanceSummary } from "@/lib/finance-display";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function money(n: number) {
  return formatMoney(n);
}

type FinanceOrder = {
  id: string;
  pickupCode: string | null;
  total: number;
  paymentMethod: string | null;
  invoiceNumber: string | null;
  invoiceAmount: number | null;
  user: { email: string; name: string | null };
};

export default function AdminFinanzasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [orders, setOrders] = useState<FinanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [mpPercent, setMpPercent] = useState("5.99");
  const [mpFixed, setMpFixed] = useState("0");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/admin/finanzas");
    else if (session && (session.user as { role?: string }).role !== "admin") router.push("/");
  }, [session, status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const [sumRes, ordRes, setRes] = await Promise.all([
      fetch(`/api/admin/finance/summary?year=${year}&month=${month}`),
      fetch(`/api/admin/finance/orders?year=${year}&month=${month}`),
      fetch("/api/admin/finance/settings"),
    ]);
    if (sumRes.ok) setSummary(await sumRes.json());
    if (ordRes.ok) setOrders(await ordRes.json());
    if (setRes.ok) {
      const s = await setRes.json();
      setMpPercent(String(s.mpCommissionPercent ?? 5.99));
      setMpFixed(String(s.mpFixedFee ?? 0));
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") load();
  }, [session, load]);

  async function saveSettings() {
    setSavingSettings(true);
    await fetch("/api/admin/finance/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mpCommissionPercent: parseFloat(mpPercent) || 0,
        mpFixedFee: parseFloat(mpFixed) || 0,
      }),
    });
    setSavingSettings(false);
    load();
  }

  async function saveInvoice(orderId: string, invoiceNumber: string, invoiceAmount: string) {
    await fetch(`/api/admin/finance/orders/${orderId}/invoice`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber: invoiceNumber.trim() || null,
        invoiceAmount: invoiceAmount.trim() ? parseFloat(invoiceAmount) : null,
      }),
    });
    load();
  }

  if (status === "loading" || (loading && !summary)) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Administración financiera</h1>
            <p className="text-sm text-gray-600">Liquidación mensual, costos y conciliación con facturación</p>
          </div>
          <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
            ← Panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Mes</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="rounded-lg border border-black/15 px-3 py-2"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Año</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="rounded-lg border border-black/15 px-3 py-2"
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pb-0.5">
            <Link
              href="/admin/finanzas/gastos"
              className="rounded-lg border border-black/12 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Gastos
            </Link>
            <Link
              href="/admin/finanzas/costos"
              className="rounded-lg border border-black/12 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Costos de producto
            </Link>
          </div>
        </div>

        {summary && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Cobrado", value: money(summary.collectedTotal), sub: `${summary.orderCountCollected} pedidos` },
                { label: "Pendiente de cobro", value: money(summary.pendingTotal), sub: `${summary.orderCountPending} pedidos` },
                { label: "Margen bruto", value: money(summary.grossMargin), sub: "Cobrado − COGS − comisiones" },
                { label: "Resultado neto", value: money(summary.netResult), sub: "Después de gastos operativos" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-black/8 bg-white p-5">
                  <p className="text-sm text-gray-600">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{kpi.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-black/8 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold">Detalle del mes</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt>Descuentos (cupones)</dt><dd className="text-red-600">−{money(summary.discountsTotal)}</dd></div>
                  <div className="flex justify-between"><dt>Costo mercadería (COGS)</dt><dd className="text-red-600">−{money(summary.cogsTotal)}</dd></div>
                  <div className="flex justify-between"><dt>Comisiones plataformas</dt><dd className="text-red-600">−{money(summary.platformFeesTotal)}</dd></div>
                  <div className="flex justify-between"><dt>Gastos operativos</dt><dd className="text-red-600">−{money(summary.expensesTotal)}</dd></div>
                  <div className="flex justify-between border-t border-black/8 pt-2 font-semibold">
                    <dt>Resultado neto</dt><dd>{money(summary.netResult)}</dd>
                  </div>
                </dl>
                {summary.itemsWithoutCost > 0 && (
                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    ⚠ {summary.itemsWithoutCost} unidades vendidas sin costo cargado.{" "}
                    <Link href="/admin/finanzas/costos" className="font-semibold underline">Completar costos</Link>
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-black/8 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold">Conciliación con facturación</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt>Cobrado en el mes</dt><dd>{money(summary.collectedTotal)}</dd></div>
                  <div className="flex justify-between"><dt>Facturado en el mes</dt><dd>{money(summary.invoicedTotal)}</dd></div>
                  <div className="flex justify-between border-t border-black/8 pt-2 font-semibold">
                    <dt>Diferencia</dt>
                    <dd className={summary.reconciliationDiff !== 0 ? "text-amber-700" : ""}>
                      {money(summary.reconciliationDiff)}
                    </dd>
                  </div>
                </dl>
                {summary.collectedWithoutInvoice > 0 && (
                  <p className="mt-4 text-sm text-gray-600">
                    {summary.collectedWithoutInvoice} pedido(s) cobrado(s) sin factura registrada abajo.
                  </p>
                )}
              </div>
            </div>

            {Object.keys(summary.byPaymentMethod).length > 0 && (
              <div className="rounded-xl border border-black/8 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold">Por método de pago</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-600">
                        <th className="pb-2 pr-4">Método</th>
                        <th className="pb-2 pr-4">Pedidos</th>
                        <th className="pb-2 pr-4">Total</th>
                        <th className="pb-2">Comisiones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(summary.byPaymentMethod).map(([method, row]) => (
                        <tr key={method} className="border-b border-black/5">
                          <td className="py-2 pr-4">{formatPaymentMethodLabel(method)}</td>
                          <td className="py-2 pr-4">{row.count}</td>
                          <td className="py-2 pr-4">{money(row.total)}</td>
                          <td className="py-2">{money(row.fees)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {summary.expensesByCategory.length > 0 && (
              <div className="rounded-xl border border-black/8 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold">Gastos por tipo</h2>
                <ul className="space-y-2 text-sm">
                  {summary.expensesByCategory.map((e) => (
                    <li key={e.categoryId} className="flex justify-between">
                      <span>{e.categoryName}</span>
                      <span className="font-medium text-red-700">−{money(e.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="rounded-xl border border-black/8 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">Facturación de pedidos cobrados</h2>
          <p className="mb-4 text-sm text-gray-600">
            Registrá número y monto facturado para que cuadre con lo cobrado del mes.
          </p>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500">No hay pedidos cobrados en este mes.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <InvoiceRow key={o.id} order={o} onSave={saveInvoice} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-black/8 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">Comisiones Mercado Pago</h2>
          <p className="mb-4 text-sm text-gray-600">
            Se aplican al marcar un pedido como Pagado (hasta integrar MP real).
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Comisión %</label>
              <input
                type="number"
                step="0.01"
                value={mpPercent}
                onChange={(e) => setMpPercent(e.target.value)}
                className="w-32 rounded-lg border border-black/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fee fijo $</label>
              <input
                type="number"
                step="0.01"
                value={mpFixed}
                onChange={(e) => setMpFixed(e.target.value)}
                className="w-32 rounded-lg border border-black/15 px-3 py-2"
              />
            </div>
            <button
              type="button"
              onClick={saveSettings}
              disabled={savingSettings}
              className="rounded-lg bg-[#0f3bff] px-5 py-2 font-semibold text-white disabled:opacity-50"
            >
              {savingSettings ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function InvoiceRow({
  order,
  onSave,
}: {
  order: FinanceOrder;
  onSave: (id: string, num: string, amount: string) => void;
}) {
  const [num, setNum] = useState(order.invoiceNumber ?? "");
  const [amount, setAmount] = useState(
    order.invoiceAmount != null ? String(order.invoiceAmount) : String(order.total)
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(order.id, num, amount);
    setSaving(false);
  }

  const hasInvoice = Boolean(order.invoiceNumber);

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm ${hasInvoice ? "border-green-200 bg-green-50/50" : "border-black/10"}`}>
      <div className="min-w-[120px] font-mono font-semibold">{order.pickupCode ?? order.id.slice(0, 8)}</div>
      <div className="min-w-[140px] text-gray-600">{money(Number(order.total))}</div>
      <input
        placeholder="Nº factura"
        value={num}
        onChange={(e) => setNum(e.target.value)}
        className="min-w-[140px] rounded border border-black/15 px-2 py-1.5"
      />
      <input
        type="number"
        step="0.01"
        placeholder="Monto facturado"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-32 rounded border border-black/15 px-2 py-1.5"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving ? "…" : "Guardar"}
      </button>
    </div>
  );
}
