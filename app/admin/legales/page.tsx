"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LegalPageId } from "@/lib/legal-pages";

type AdminLegalPage = {
  id: LegalPageId;
  path: string;
  description: string;
  title: string;
  content: string;
};

export default function AdminLegalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pages, setPages] = useState<AdminLegalPage[]>([]);
  const [selectedId, setSelectedId] = useState<LegalPageId>("ayuda");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/legales");
    } else if (session && (session.user as { role?: string }).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") {
      loadPages();
    }
  }, [session]);

  async function loadPages() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/legal-pages");
      if (res.ok) {
        const data = await res.json();
        setPages(Array.isArray(data) ? data : []);
      } else {
        setError("No se pudieron cargar las páginas");
      }
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  const selected = pages.find((p) => p.id === selectedId);

  function updateSelected(patch: Partial<Pick<AdminLegalPage, "title" | "content">>) {
    setPages((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, ...patch } : p))
    );
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/legal-pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          title: selected.title,
          content: selected.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
      } else {
        setPages(Array.isArray(data) ? data : pages);
        setMessage("Cambios guardados correctamente");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {
      setError("Error de conexión");
    }
    setSaving(false);
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
              ← Volver al panel
            </Link>
            <h1 className="mt-1 text-2xl font-bold">Páginas legales y ayuda</h1>
          </div>
          {selected && (
            <Link
              href={selected.path}
              target="_blank"
              className="text-sm font-medium text-[#0f3bff] hover:underline"
            >
              Ver en el sitio →
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-black/8 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-600">Páginas</h2>
          <ul className="space-y-1">
            {pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(page.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedId === page.id
                      ? "bg-[#0f3bff]/10 font-semibold text-[#0f3bff]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="block">{page.description}</span>
                  <span className="text-xs text-gray-500">{page.path}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="rounded-lg border border-black/8 bg-white p-6">
          {selected ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold">{selected.description}</h2>
                <p className="text-sm text-gray-600">URL: {selected.path}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Título de la página</label>
                  <input
                    type="text"
                    value={selected.title}
                    onChange={(e) => updateSelected({ title: e.target.value })}
                    className="w-full rounded-lg border border-black/20 px-4 py-2.5 text-sm outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Contenido</label>
                  <p className="mb-2 text-xs text-gray-500">
                    Separá párrafos con una línea en blanco. El texto se muestra tal cual en el sitio.
                  </p>
                  <textarea
                    value={selected.content}
                    onChange={(e) => updateSelected({ content: e.target.value })}
                    rows={18}
                    className="w-full rounded-lg border border-black/20 px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              {message && <p className="mt-4 text-sm text-green-600">{message}</p>}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[#0f3bff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0d32cc] disabled:bg-gray-300"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <Link
                  href={selected.path}
                  target="_blank"
                  className="inline-flex items-center rounded-lg border border-black/15 px-6 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Vista previa
                </Link>
              </div>
            </>
          ) : (
            <p className="text-gray-600">Seleccioná una página para editar.</p>
          )}
        </div>
      </main>
    </div>
  );
}
