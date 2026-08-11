"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { ShippingZone } from "@/lib/shipping-zones";

type ZoneForm = Omit<ShippingZone, "postalCodes"> & { postalCodesText: string };

function zoneToForm(z: ShippingZone): ZoneForm {
  return {
    ...z,
    postalCodesText: z.postalCodes.join(", "),
  };
}

function formToZone(f: ZoneForm, order: number): ShippingZone {
  return {
    id: f.id,
    name: f.name,
    postalCodes: f.postalCodesText
      .split(/[,;\n]+/)
      .map((p) => p.trim())
      .filter(Boolean),
    price: f.price,
    active: f.active,
    order,
    estimatedDays: f.estimatedDays,
    isDefault: f.isDefault,
  };
}

function newZone(order: number): ZoneForm {
  return {
    id: `zone-${Date.now().toString(36)}`,
    name: "Nueva zona",
    postalCodesText: "",
    price: 5000,
    active: true,
    order,
    estimatedDays: "",
    isDefault: false,
  };
}

export default function AdminEnviosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [freeShippingMin, setFreeShippingMin] = useState("");
  const [zones, setZones] = useState<ZoneForm[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/envios");
    } else if (session && (session.user as { role?: string }).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") {
      void loadSettings();
    }
  }, [session]);

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/shipping-zones");
      if (!res.ok) throw new Error("No se pudo cargar");
      const data = await res.json();
      setEnabled(data.enabled !== false);
      setFreeShippingMin(
        data.freeShippingMin != null && data.freeShippingMin > 0
          ? String(data.freeShippingMin)
          : ""
      );
      setZones(
        Array.isArray(data.zones) && data.zones.length > 0
          ? data.zones.map((z: ShippingZone) => zoneToForm(z))
          : []
      );
    } catch {
      setError("No se pudieron cargar las zonas de envío");
    } finally {
      setLoading(false);
    }
  }

  function updateZone(index: number, patch: Partial<ZoneForm>) {
    setZones((prev) => prev.map((z, i) => (i === index ? { ...z, ...patch } : z)));
  }

  function moveZone(index: number, dir: -1 | 1) {
    setZones((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const parsedZones = zones.map((z, i) => formToZone(z, i));
    const invalid = parsedZones.find((z) => z.postalCodes.length === 0 || !z.name.trim());
    if (invalid) {
      setError("Cada zona necesita nombre y al menos un prefijo de CP (o * para resto del país).");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/shipping-zones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          freeShippingMin: freeShippingMin.trim() ? Number(freeShippingMin) : null,
          zones: parsedZones,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setMessage("Zonas de envío guardadas");
      setZones(data.zones.map((z: ShippingZone) => zoneToForm(z)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
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
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
            ← Volver al panel
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Envíos por código postal</h1>
          <p className="mt-1 text-sm text-gray-600">
            Fase 1: tarifas fijas por zona. El checkout cotiza según el CP del cliente.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-sm">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#0f3bff]"
              />
              <span className="font-medium">Habilitar envíos a domicilio en el checkout</span>
            </label>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">
                Envío gratis desde (subtotal, opcional)
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={freeShippingMin}
                onChange={(e) => setFreeShippingMin(e.target.value)}
                placeholder="Ej: 50000"
                className="min-h-[44px] w-full max-w-xs rounded-lg border border-black/20 px-4 py-2 text-sm"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Zonas</h2>
              <button
                type="button"
                onClick={() => setZones((z) => [...z, newZone(z.length)])}
                className="rounded-lg border border-black/15 px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                + Agregar zona
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Prefijos de CP separados por coma (ej: <code>10, 11, 12</code> para CABA). Usá{" "}
              <code>*</code> en una zona para el resto del país.
            </p>

            {zones.map((zone, index) => (
              <div
                key={zone.id}
                className="rounded-xl border border-black/8 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={zone.active}
                      onChange={(e) => updateZone(index, { active: e.target.checked })}
                      className="accent-[#0f3bff]"
                    />
                    Activa
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveZone(index, -1)}
                      disabled={index === 0}
                      className="rounded border px-2 py-1 text-xs disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveZone(index, 1)}
                      disabled={index === zones.length - 1}
                      className="rounded border px-2 py-1 text-xs disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setZones((z) => z.filter((_, i) => i !== index))}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Nombre zona</label>
                    <input
                      type="text"
                      value={zone.name}
                      onChange={(e) => updateZone(index, { name: e.target.value })}
                      className="min-h-[44px] w-full rounded-lg border border-black/20 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Precio ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={zone.price}
                      onChange={(e) =>
                        updateZone(index, { price: Number(e.target.value) || 0 })
                      }
                      className="min-h-[44px] w-full rounded-lg border border-black/20 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-sm font-medium">Prefijos / CP</label>
                  <input
                    type="text"
                    value={zone.postalCodesText}
                    onChange={(e) => updateZone(index, { postalCodesText: e.target.value })}
                    placeholder="10, 11, 12, 13, 14  o  *"
                    className="min-h-[44px] w-full rounded-lg border border-black/20 px-3 py-2 text-sm"
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Plazo estimado</label>
                    <input
                      type="text"
                      value={zone.estimatedDays ?? ""}
                      onChange={(e) => updateZone(index, { estimatedDays: e.target.value })}
                      placeholder="Ej: 3 a 5 días hábiles"
                      className="min-h-[44px] w-full rounded-lg border border-black/20 px-3 py-2 text-sm"
                    />
                  </div>
                  <label className="flex items-end gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={zone.isDefault ?? false}
                      onChange={(e) => updateZone(index, { isDefault: e.target.checked })}
                      className="accent-[#0f3bff]"
                    />
                    Zona por defecto (fallback)
                  </label>
                </div>
              </div>
            ))}
          </section>

          <button
            type="submit"
            disabled={saving}
            className="min-h-[48px] w-full rounded-lg bg-[#0f3bff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d32cc] disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </main>
    </div>
  );
}
