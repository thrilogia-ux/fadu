"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  active: boolean;
  _count: { products: number };
}

export default function AdminCategoriasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    order: 0,
    active: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/categorias");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as any).role === "admin") {
      loadCategories();
    }
  }, [session]);

  async function loadCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", order: categories.length, active: true });
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, order: cat.order, active: cat.active });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories";
    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        loadCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        loadCategories();
      } else {
        alert(data.error || "Error al eliminar");
      }
    } catch {
      alert("Error de conexión");
    }
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
            <h1 className="text-2xl font-bold">Categorías ({categories.length})</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={openNew}
                className="rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d32cc]"
              >
                + Nueva categoría
              </button>
              <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
                ← Volver al panel
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6">
              <h2 className="mb-6 text-xl font-bold">
                {editing ? "Editar categoría" : "Nueva categoría"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Orden</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
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
                  <span className="text-sm">Activa</span>
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
        {categories.length === 0 ? (
          <div className="rounded-lg border border-black/8 bg-white p-12 text-center">
            <p className="mb-4 text-gray-600">No hay categorías</p>
            <button onClick={openNew} className="text-[#0f3bff] hover:underline">
              Crear la primera categoría
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-black/8 bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">#{cat.order}</span>
                  <div>
                    <h3 className="font-semibold">{cat.name}</h3>
                    <p className="text-sm text-gray-600">
                      {cat._count.products} producto(s) · /{cat.slug}
                    </p>
                  </div>
                  {!cat.active && (
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs">Inactiva</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
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
