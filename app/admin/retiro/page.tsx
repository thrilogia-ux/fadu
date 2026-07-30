"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DAY_NAMES } from "@/lib/pickup";

type SlotForm = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

const emptySlot = (): SlotForm => ({
  dayOfWeek: 3,
  startTime: "16:00",
  endTime: "20:00",
  active: true,
});

export default function AdminRetiroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState("Av. San Juan 350, CABA");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<SlotForm[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/retiro");
    } else if (session && (session.user as { role?: string }).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") {
      loadConfig();
    }
  }, [session]);

  async function loadConfig() {
    try {
      const res = await fetch("/api/admin/pickup-config");
      if (res.ok) {
        const data = await res.json();
        setAddress(data.address || "");
        setNotes(data.notes || "");
        setSlots(
          Array.isArray(data.slots) && data.slots.length > 0
            ? data.slots.map((s: SlotForm & { sortOrder?: number }) => ({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                active: s.active !== false,
              }))
            : [emptySlot()]
        );
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function updateSlot(index: number, patch: Partial<SlotForm>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSlot() {
    setSlots((prev) => [...prev, emptySlot()]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pickup-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          notes: notes.trim() || null,
          slots: slots.map((s, i) => ({ ...s, sortOrder: i })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("Horarios de retiro guardados");
        loadConfig();
      } else {
        alert(data.error || "Error al guardar");
      }
    } catch {
      alert("Error de conexión");
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
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">Retiro y horarios</h1>
            <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
              ← Panel admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="mb-6 text-sm text-gray-600">
          Configurá la dirección y los días/horarios de entrega en el Pickup Point. Se muestran en{" "}
          <Link href="/retiro" className="text-[#0f3bff] hover:underline" target="_blank">
            /retiro
          </Link>
          , en la ficha de pedido y en los emails.
        </p>

        <form onSubmit={handleSave} className="space-y-6 rounded-lg border border-black/10 bg-white p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold">Dirección</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ej: Presentá el QR del email al retirar."
              className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20"
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Días y horarios de retiro</h2>
              <button
                type="button"
                onClick={addSlot}
                className="text-sm font-semibold text-[#0f3bff] hover:underline"
              >
                + Agregar franja
              </button>
            </div>

            <div className="space-y-3">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-lg border border-black/10 bg-gray-50 p-4 sm:flex-row sm:items-end"
                >
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Día</label>
                    <select
                      value={slot.dayOfWeek}
                      onChange={(e) =>
                        updateSlot(index, { dayOfWeek: parseInt(e.target.value, 10) })
                      }
                      className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                    >
                      {DAY_NAMES.map((name, i) => (
                        <option key={name} value={i}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Desde</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(index, { startTime: e.target.value })}
                      className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Hasta</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(index, { endTime: e.target.value })}
                      className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={slot.active}
                      onChange={(e) => updateSlot(index, { active: e.target.checked })}
                    />
                    Activo
                  </label>
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#0f3bff] py-3 font-semibold text-white hover:bg-[#0d32cc] disabled:bg-gray-300 sm:w-auto sm:px-8"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </main>
    </div>
  );
}
