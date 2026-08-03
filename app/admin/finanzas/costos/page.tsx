"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/finance-display";

type ProductCost = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  costPrice: number | null;
  category: { name: string };
};

export default function AdminFinanzasCostosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<ProductCost[]>([]);
  const [costs, setCosts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/admin/finanzas/costos");
    else if (session && (session.user as { role?: string }).role !== "admin") router.push("/");
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") {
      fetch("/api/admin/finance/products")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setProducts(data);
            const map: Record<string, string> = {};
            for (const p of data) {
              map[p.id] = p.costPrice != null ? String(p.costPrice) : "";
            }
            setCosts(map);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  function marginPercent(price: number, cost: number): string {
    if (!price || cost <= 0) return "—";
    return `${Math.round(((price - cost) / price) * 100)}%`;
  }

  async function save() {
    setSaving(true);
    const updates = products.map((p) => ({
      id: p.id,
      costPrice: costs[p.id]?.trim() === "" ? null : costs[p.id],
    }));
    const res = await fetch("/api/admin/finance/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    setSaving(false);
    if (res.ok) alert("Costos guardados");
    else alert("Error al guardar");
  }

  const missing = products.filter((p) => !costs[p.id]?.trim()).length;

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Costos de producto</h1>
            <p className="text-sm text-gray-600">Costo unitario para margen y liquidación mensual</p>
          </div>
          <Link href="/admin/finanzas" className="text-sm text-[#0f3bff] hover:underline">
            ← Finanzas
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {missing > 0 && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            {missing} producto(s) sin costo cargado. Las ventas futuras guardarán el snapshot al confirmar el pedido.
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-black/8 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-600">
                <th className="p-3">Producto</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Precio venta</th>
                <th className="p-3">Costo unitario</th>
                <th className="p-3">Margen %</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const costNum = parseFloat(costs[p.id] ?? "");
                const hasCost = Number.isFinite(costNum) && costNum >= 0;
                return (
                  <tr key={p.id} className="border-b border-black/5">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-gray-600">{p.category.name}</td>
                    <td className="p-3">{formatMoney(Number(p.price))}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={costs[p.id] ?? ""}
                        onChange={(e) => setCosts({ ...costs, [p.id]: e.target.value })}
                        className="w-28 rounded border border-black/15 px-2 py-1"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-3">
                      {hasCost ? marginPercent(Number(p.price), costNum) : (
                        <span className="text-amber-600">Sin costo</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 rounded-lg bg-[#0f3bff] px-8 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar todos los costos"}
        </button>
      </main>
    </div>
  );
}
