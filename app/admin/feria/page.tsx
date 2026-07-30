"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FairModeSettings = {
  enabled: boolean;
  title: string;
  message: string;
  hideMercadoPago: boolean;
};

export default function AdminFeriaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<FairModeSettings>({
    enabled: false,
    title: "Modo feria FADU",
    message: "",
    hideMercadoPago: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/admin/feria");
    else if (session && (session.user as { role?: string }).role !== "admin") router.push("/");
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") {
      fetch("/api/admin/fair-mode")
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) setSettings(data);
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/fair-mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) alert("Modo feria guardado");
    else alert("Error al guardar");
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-2xl font-bold">Modo feria</h1>
          <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
            ← Panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-6 rounded-xl border border-black/8 bg-white p-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            <span className="font-semibold">Activar modo feria</span>
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium">Título en checkout</label>
            <input
              value={settings.title}
              onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))}
              className="w-full rounded-lg border border-black/15 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Mensaje</label>
            <textarea
              value={settings.message}
              onChange={(e) => setSettings((s) => ({ ...s, message: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-black/15 px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.hideMercadoPago}
              onChange={(e) => setSettings((s) => ({ ...s, hideMercadoPago: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm">Ocultar Mercado Pago (solo transferencia en feria)</span>
          </label>

          <p className="text-sm text-gray-600">
            Los clientes pueden descargar el QR de retiro desde la ficha del pedido cuando está listo.
          </p>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[#0f3bff] px-6 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </main>
    </div>
  );
}
