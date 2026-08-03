"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/finance-display";

type Category = { id: string; name: string; active: boolean };
type Expense = {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  category: { id: string; name: string };
};

export default function AdminFinanzasGastosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [form, setForm] = useState({
    categoryId: "",
    description: "",
    amount: "",
    expenseDate: now.toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/admin/finanzas/gastos");
    else if (session && (session.user as { role?: string }).role !== "admin") router.push("/");
  }, [session, status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const [catRes, expRes] = await Promise.all([
      fetch("/api/admin/finance/expense-categories"),
      fetch(`/api/admin/finance/expenses?year=${year}&month=${month}`),
    ]);
    if (catRes.ok) {
      const cats = await catRes.json();
      setCategories(cats);
      if (!form.categoryId && cats[0]?.id) {
        setForm((f) => ({ ...f, categoryId: cats[0].id }));
      }
    }
    if (expRes.ok) setExpenses(await expRes.json());
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") load();
  }, [session, load]);

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/admin/finance/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    if (res.ok) {
      setNewCategoryName("");
      load();
    } else alert("No se pudo crear el tipo");
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm((f) => ({ ...f, description: "", amount: "" }));
      load();
    } else alert("Error al guardar gasto");
  }

  async function removeExpense(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    await fetch(`/api/admin/finance/expenses/${id}`, { method: "DELETE" });
    load();
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-2xl font-bold">Gastos operativos</h1>
          <Link href="/admin/finanzas" className="text-sm text-[#0f3bff] hover:underline">
            ← Finanzas
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div className="flex gap-4">
          <input
            type="number"
            value={month}
            min={1}
            max={12}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="w-20 rounded-lg border px-3 py-2"
          />
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="w-28 rounded-lg border px-3 py-2"
          />
        </div>

        <div className="rounded-xl border border-black/8 bg-white p-6">
          <h2 className="mb-4 font-bold">Tipos de gasto</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.filter((c) => c.active).map((c) => (
              <span key={c.id} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {c.name}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nuevo tipo (ej. Impresiones)"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addCategory}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
            >
              Agregar tipo
            </button>
          </div>
        </div>

        <form onSubmit={addExpense} className="rounded-xl border border-black/8 bg-white p-6 space-y-4">
          <h2 className="font-bold">Registrar gasto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                required
              >
                {categories.filter((c) => c.active).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fecha</label>
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Descripción</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Monto $</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#0f3bff] px-6 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar gasto"}
          </button>
        </form>

        <div className="rounded-xl border border-black/8 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Gastos del período</h2>
            <span className="text-lg font-bold text-red-700">{formatMoney(total)}</span>
          </div>
          {expenses.length === 0 ? (
            <p className="text-sm text-gray-500">Sin gastos en este mes.</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {expenses.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <span className="font-medium">{e.category.name}</span>
                    <span className="mx-2 text-gray-400">·</span>
                    {e.description}
                    <span className="ml-2 text-gray-500">
                      {new Date(e.expenseDate).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatMoney(Number(e.amount))}</span>
                    <button
                      type="button"
                      onClick={() => removeExpense(e.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
