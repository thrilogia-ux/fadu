"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Order {
  id: string;
  pickupCode: string;
  total: number;
  user: { name: string | null; email: string };
  items: { product: { name: string }; quantity: number }[];
}

export default function ValidarRetiroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pickedUpBy, setPickedUpBy] = useState("");
  const [pickedUpDni, setPickedUpDni] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/validar-retiro");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  async function validateCode(code: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/validate-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al validar código");
        setOrder(null);
      } else {
        setOrder(data);
        setError("");
      }
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) {
      validateCode(manualCode.trim().toUpperCase());
    }
  }

  function startScanning() {
    setScanning(true);
    setError("");
    
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setScanning(false);
          validateCode(decodedText);
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuos
        }
      );
    }, 100);
  }

  async function completePickup() {
    if (!order) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/complete-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          pickedUpBy: pickedUpBy.trim() || null,
          pickedUpDni: pickedUpDni.trim() || null,
        }),
      });
      if (res.ok) {
        alert("Pedido marcado como entregado ✅");
        setOrder(null);
        setManualCode("");
        setPickedUpBy("");
        setPickedUpDni("");
      } else {
        const data = await res.json();
        setError(data.error || "Error al completar retiro");
      }
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session || (session.user as any).role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-[#1d1d1b]">Validar retiro de pedido</h1>

        {/* Input manual */}
        <div className="mb-6 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Ingresar código manualmente</h2>
          <form onSubmit={handleManualSubmit} className="flex gap-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="FADU-2026-00123"
              className="flex-1 rounded-lg border border-black/20 px-4 py-3 text-sm outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20"
            />
            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="rounded-lg bg-[#0f3bff] px-6 py-3 font-semibold text-white hover:bg-[#0d32cc] disabled:bg-gray-300"
            >
              Validar
            </button>
          </form>
        </div>

        {/* Botón escanear QR */}
        {!scanning && (
          <button
            onClick={startScanning}
            className="mb-6 w-full rounded-lg border-2 border-[#0f3bff] bg-white py-4 text-lg font-semibold text-[#0f3bff] hover:bg-[#0f3bff]/5"
          >
            📷 Escanear código QR
          </button>
        )}

        {/* Lector QR */}
        {scanning && (
          <div className="mb-6 rounded-lg border border-black/10 bg-white p-6">
            <div id="qr-reader" className="w-full"></div>
            <button
              onClick={() => {
                setScanning(false);
                const reader = document.getElementById("qr-reader");
                if (reader) reader.innerHTML = "";
              }}
              className="mt-4 w-full rounded-lg border border-gray-300 py-2 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Detalles del pedido */}
        {order && (
          <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1d1d1b]">Pedido encontrado</h2>
                <p className="text-sm text-gray-600">Código: {order.pickupCode}</p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                Listo para retirar
              </span>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-semibold">{order.user.name || order.user.email}</p>
              <p className="text-sm text-gray-600">{order.user.email}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Productos</p>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span>{item.product.name} x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="mb-6 border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${Number(order.total).toLocaleString("es-AR")}</span>
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre de quien retira (opcional)</label>
                <input
                  type="text"
                  value={pickedUpBy}
                  onChange={(e) => setPickedUpBy(e.target.value)}
                  className="w-full rounded-lg border border-black/20 px-4 py-2 outline-none focus:border-[#0f3bff]"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">DNI (opcional)</label>
                <input
                  type="text"
                  value={pickedUpDni}
                  onChange={(e) => setPickedUpDni(e.target.value)}
                  className="w-full rounded-lg border border-black/20 px-4 py-2 outline-none focus:border-[#0f3bff]"
                  placeholder="12345678"
                />
              </div>
            </div>

            <button
              onClick={completePickup}
              disabled={loading}
              className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-300"
            >
              ✅ Confirmar entrega
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
