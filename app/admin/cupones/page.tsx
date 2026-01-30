"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minPurchase: number | null;
  validFrom: string;
  validUntil: string;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
}

export default function AdminCuponesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    minPurchase: "",
    validFrom: today,
    validUntil: nextMonth,
    usageLimit: "",
    active: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/cupones");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as any).role === "admin") {
      loadCoupons();
    }
  }, [session]);

  async function loadCoupons() {
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        setCoupons(await res.json());
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({
      code: "",
      type: "percent",
      value: "",
      minPurchase: "",
      validFrom: today,
      validUntil: nextMonth,
      usageLimit: "",
      active: true,
    });
    setShowForm(true);
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minPurchase: coupon.minPurchase ? String(coupon.minPurchase) : "",
      validFrom: coupon.validFrom.split("T")[0],
      validUntil: coupon.validUntil.split("T")[0],
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      active: coupon.active,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editing ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons";
    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        loadCoupons();
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cupón?")) return;

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCoupons(coupons.filter((c) => c.id !== id));
      }
    } catch {
      alert("Error al eliminar");
    }
  }

  function isExpired(validUntil: string) {
    return new Date(validUntil) < new Date();
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session || (session.user as any).role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Cupones ({coupons.length})</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={openNew}
                className="rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d32cc]"
              >
                + Nuevo cupón
              </button>
              <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
                ← Volver al panel
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
              <h2 className="mb-6 text-xl font-bold">
                {editing ? "Editar cupón" : "Nuevo cupón"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Código *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="DESCUENTO10"
                    className="w-full rounded-lg border border-black/20 px-4 py-2.5 uppercase outline-none focus:border-[#0f3bff]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Tipo *</label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value as "percent" | "fixed" })
                      }
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    >
                      <option value="percent">Porcentaje (%)</option>
                      <option value="fixed">Monto fijo ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Valor * {form.type === "percent" ? "(%)" : "($)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      required
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Compra mínima ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.minPurchase}
                    onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                    placeholder="Sin mínimo"
                    className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Válido desde *</label>
                    <input
                      type="date"
                      value={form.validFrom}
                      onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                      required
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Válido hasta *</label>
                    <input
                      type="date"
                      value={form.validUntil}
                      onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                      required
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Límite de usos</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="Sin límite"
                    className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Activo</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-lg border border-black/20 py-2.5 font-semibold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-[#0f3bff] py-2.5 font-semibold text-white hover:bg-[#0d32cc]"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista */}
        {coupons.length === 0 ? (
          <div className="rounded-lg border border-black/8 bg-white p-12 text-center">
            <p className="mb-4 text-gray-600">No hay cupones</p>
            <button onClick={openNew} className="text-[#0f3bff] hover:underline">
              Crear el primer cupón
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center justify-between rounded-lg border border-black/8 bg-white p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold">{coupon.code}</span>
                    {!coupon.active && (
                      <span className="rounded bg-gray-200 px-2 py-0.5 text-xs">Inactivo</span>
                    )}
                    {isExpired(coupon.validUntil) && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        Expirado
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {coupon.type === "percent"
                      ? `${coupon.value}% de descuento`
                      : `$${Number(coupon.value).toLocaleString("es-AR")} de descuento`}
                    {coupon.minPurchase &&
                      ` · Mín. $${Number(coupon.minPurchase).toLocaleString("es-AR")}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(coupon.validFrom).toLocaleDateString("es-AR")} -{" "}
                    {new Date(coupon.validUntil).toLocaleDateString("es-AR")}
                    {coupon.usageLimit && ` · ${coupon.usedCount}/${coupon.usageLimit} usos`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(coupon)}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
