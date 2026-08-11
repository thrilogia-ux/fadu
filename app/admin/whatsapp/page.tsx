"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DEFAULT_WHATSAPP_PHONE } from "@/lib/whatsapp";

function formatPhoneDisplay(digits: string): string {
  if (digits.startsWith("549") && digits.length >= 12) {
    const rest = digits.slice(3);
    return `+54 9 ${rest.slice(0, 2)} ${rest.slice(2, 6)}-${rest.slice(6)}`;
  }
  return digits;
}

export default function AdminWhatsAppPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState(DEFAULT_WHATSAPP_PHONE);
  const [floatingGreeting, setFloatingGreeting] = useState("");
  const [floatingEnabled, setFloatingEnabled] = useState(true);
  const [notifyOnPickupReady, setNotifyOnPickupReady] = useState(true);
  const [notifyOnShipped, setNotifyOnShipped] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/whatsapp");
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
      const res = await fetch("/api/admin/whatsapp-settings");
      if (!res.ok) throw new Error("No se pudo cargar");
      const data = await res.json();
      setPhone(typeof data.phone === "string" ? data.phone : DEFAULT_WHATSAPP_PHONE);
      setFloatingGreeting(typeof data.floatingGreeting === "string" ? data.floatingGreeting : "");
      setFloatingEnabled(data.floatingEnabled !== false);
      setNotifyOnPickupReady(data.notifyOnPickupReady !== false);
      setNotifyOnShipped(data.notifyOnShipped !== false);
    } catch {
      setError("No se pudo cargar la configuración de WhatsApp");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Ingresá un número válido (mínimo 10 dígitos).");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/whatsapp-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digits,
          floatingGreeting: floatingGreeting.trim(),
          floatingEnabled,
          notifyOnPickupReady,
          notifyOnShipped,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setPhone(data.phone);
      setFloatingGreeting(data.floatingGreeting ?? "");
      setMessage("Configuración de WhatsApp guardada");
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

  const previewPhone = formatPhoneDisplay(phone.replace(/\D/g, "") || DEFAULT_WHATSAPP_PHONE);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
            ← Volver al panel
          </Link>
          <h1 className="mt-2 text-2xl font-bold">WhatsApp</h1>
          <p className="mt-1 text-sm text-gray-600">
            Número de contacto, botón flotante y avisos asistidos al cliente desde pedidos.
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
            <h2 className="mb-4 text-lg font-semibold">Número de la tienda</h2>
            <label className="mb-1 block text-sm font-medium">
              Teléfono WhatsApp (solo dígitos, ej. 5491168333363)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5491168333363"
              className="min-h-[48px] w-full rounded-lg border border-black/20 px-4 py-2.5 text-base sm:text-sm"
            />
            <p className="mt-2 text-xs text-gray-600">
              Vista previa: {previewPhone}. También podés usar{" "}
              <code>NEXT_PUBLIC_WHATSAPP_PHONE</code> en Vercel (tiene prioridad sobre este valor).
            </p>
          </section>

          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Botón flotante</h2>
            <label className="mb-4 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={floatingEnabled}
                onChange={(e) => setFloatingEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#0f3bff]"
              />
              <span className="font-medium">Mostrar botón flotante en el sitio</span>
            </label>
            <label className="mb-1 block text-sm font-medium">Mensaje inicial del botón</label>
            <textarea
              value={floatingGreeting}
              onChange={(e) => setFloatingGreeting(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Hola! Tengo una consulta sobre UBAfadu.shop"
              className="w-full rounded-lg border border-black/20 px-4 py-2.5 text-sm"
            />
          </section>

          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">Avisos desde Admin → Pedidos</h2>
            <p className="mb-4 text-sm text-gray-600">
              Links <code>wa.me</code> con mensaje precargado. Vos apretás Enviar en WhatsApp (sin API
              de Meta).
            </p>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={notifyOnPickupReady}
                  onChange={(e) => setNotifyOnPickupReady(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#0f3bff]"
                />
                <span>
                  <span className="font-medium">Pedido listo para retirar</span>
                  <span className="mt-0.5 block text-sm text-gray-600">
                    Botón &quot;Avisar por WhatsApp&quot; en pedidos de retiro en FADU.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={notifyOnShipped}
                  onChange={(e) => setNotifyOnShipped(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#0f3bff]"
                />
                <span>
                  <span className="font-medium">Pedido enviado a domicilio</span>
                  <span className="mt-0.5 block text-sm text-gray-600">
                    Botón con tracking cuando marques un envío como despachado.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 text-sm text-indigo-950">
            <h2 className="mb-2 font-semibold">Opt-in del cliente</h2>
            <p>
              En checkout y perfil el cliente puede marcar &quot;Quiero avisos por WhatsApp&quot;. Si
              cargó teléfono y aceptó, al marcar listo para retirar el admin ve un recordatorio para
              avisarle.
            </p>
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
