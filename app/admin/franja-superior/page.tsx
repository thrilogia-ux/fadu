"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BannerMessage {
  id: string;
  text: string;
  order: number;
  active: boolean;
  createdAt: string;
}

export default function AdminFranjaSuperiorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<BannerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BannerMessage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ text: "", order: 0, active: true });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/franja-superior");
    } else if (session && (session.user as { role?: string }).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") {
      loadMessages();
    }
  }, [session]);

  async function loadMessages() {
    try {
      const res = await fetch("/api/admin/top-banner-messages");
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ text: "", order: messages.length, active: true });
    setShowForm(true);
  }

  function openEdit(m: BannerMessage) {
    setEditing(m);
    setForm({ text: m.text, order: m.order, active: m.active });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing
      ? `/api/admin/top-banner-messages/${editing.id}`
      : "/api/admin/top-banner-messages";
    const method = editing ? "PATCH" : "POST";
    const body = editing
      ? { text: form.text, order: form.order, active: form.active }
      : { text: form.text, order: form.order, active: form.active };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowForm(false);
        loadMessages();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este mensaje?")) return;
    try {
      const res = await fetch(`/api/admin/top-banner-messages/${id}`, { method: "DELETE" });
      if (res.ok) loadMessages();
    } catch {
      alert("Error al eliminar");
    }
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session || (session.user as { role?: string }).role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">Franja superior (marquesina)</h1>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={openNew}
                className="rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d32cc]"
              >
                + Nuevo mensaje
              </button>
              <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
                ← Volver al panel
              </Link>
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Los mensajes <strong>activos</strong> se muestran en la barra azul del sitio. Con más de
            uno, pasan en marquesina. Orden: número más bajo primero.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold">
                {editing ? "Editar mensaje" : "Nuevo mensaje"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Texto (máx. 500 caracteres)</label>
                  <textarea
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                    rows={3}
                    maxLength={500}
                    required
                    placeholder="Ej: Retirás tu compra en el Pickup Point en FADU"
                    className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                  />
                  <p className="mt-1 text-xs text-gray-500">{form.text.length}/500</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Orden</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
                    className="w-32 rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Activo (visible en el sitio)
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d32cc]"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-black/20 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-black/10 bg-[#0f3bff] px-4 py-3 text-center text-sm font-medium text-white">
          Vista previa del color de la franja en el sitio
        </div>

        <ul className="space-y-3">
          {messages.length === 0 && (
            <li className="rounded-lg border border-dashed border-black/20 bg-white p-8 text-center text-gray-500">
              No hay mensajes. Creá uno o ejecutá el seed / migración en la base de datos.
            </li>
          )}
          {messages.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#1d1d1b]">{m.text}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Orden: {m.order} · {m.active ? "Activo" : "Inactivo"}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(m)}
                  className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
