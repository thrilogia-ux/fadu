"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FairModeType } from "@/lib/fair-mode";
import { fairModePresetForType } from "@/lib/fair-mode";

type FairModeSettings = {
  mode: FairModeType;
  enabled: boolean;
  title: string;
  message: string;
  hideMercadoPago: boolean;
};

const MODE_OPTIONS: { value: FairModeType; label: string; description: string }[] = [
  {
    value: "off",
    label: "Desactivado",
    description: "Checkout normal: retiro en FADU con QR después del pago online.",
  },
  {
    value: "pickup_qr",
    label: "Feria con retiro QR",
    description:
      "Banner en checkout, opcional ocultar Mercado Pago. El cliente paga online y retira en FADU con QR.",
  },
  {
    value: "presencial",
    label: "Feria venta presencial",
    description:
      "Venta en el stand con entrega inmediata. Descuenta stock al confirmar. Sin QR ni retiro en pickup.",
  },
];

export default function AdminFeriaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<FairModeSettings>({
    mode: "off",
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

  function setMode(mode: FairModeType) {
    setSettings((s) => {
      if (mode === "off") {
        return { ...s, mode, enabled: false };
      }
      const preset = fairModePresetForType(mode);
      return {
        ...s,
        mode,
        enabled: true,
        title: s.mode === mode ? s.title : preset.title,
        message: s.mode === mode ? s.message : preset.message,
        hideMercadoPago: true,
      };
    });
  }

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

  const isPresencial = settings.mode === "presencial";
  const isPickupQr = settings.mode === "pickup_qr";

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
          <div>
            <p className="mb-3 text-sm font-medium text-gray-700">Tipo de feria</p>
            <div className="space-y-3">
              {MODE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition ${
                    settings.mode === opt.value
                      ? "border-[#0f3bff] bg-[#0f3bff]/5"
                      : "border-black/10 hover:border-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="fair-mode"
                    checked={settings.mode === opt.value}
                    onChange={() => setMode(opt.value)}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-semibold">{opt.label}</span>
                    <p className="mt-1 text-sm text-gray-600">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {settings.mode !== "off" && (
            <>
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

              {!isPresencial && (
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.hideMercadoPago}
                    onChange={(e) => setSettings((s) => ({ ...s, hideMercadoPago: e.target.checked }))}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">Ocultar Mercado Pago (solo transferencia en feria)</span>
                </label>
              )}
            </>
          )}

          {isPickupQr && (
            <p className="text-sm text-gray-600">
              Los clientes reciben el QR de retiro por email cuando el pedido está listo para retirar en FADU.
            </p>
          )}

          {isPresencial && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Venta presencial activa</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>El checkout ofrece pago en el stand (efectivo / POS manual).</li>
                <li>Al confirmar, el pedido queda entregado y el stock se descuenta al instante.</li>
                <li>No se genera QR ni flujo de retiro en pickup.</li>
              </ul>
            </div>
          )}

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
