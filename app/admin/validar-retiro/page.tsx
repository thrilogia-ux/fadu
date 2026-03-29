"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { orderItemProductName } from "@/lib/order-item-display";

const QR_REGION_ID = "qr-reader";

function pickRearCameraId(devices: { id: string; label: string }[]): string | undefined {
  const rear = devices.find((d) => /back|rear|trasera|environment|wide|ultra/i.test(d.label));
  if (rear) return rear.id;
  if (devices.length >= 2) return devices[devices.length - 1].id;
  return devices[0]?.id;
}

interface Order {
  id: string;
  pickupCode: string;
  total: number;
  user: { name: string | null; email: string };
  items: {
    product: { name: string } | null;
    productNameSnapshot?: string | null;
    quantity: number;
  }[];
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanHandledRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/validar-retiro");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  const validateCode = useCallback(async (code: string) => {
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
  }, []);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) {
      validateCode(manualCode.trim().toUpperCase());
    }
  }

  function startScanning() {
    scanHandledRef.current = false;
    setError("");
    setScanning(true);
  }

  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;

    const stopScanner = async () => {
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (!instance) return;
      try {
        if (instance.isScanning) await instance.stop();
      } catch {
        /* ya detenido */
      }
      try {
        instance.clear();
      } catch {
        /* */
      }
    };

    const run = async () => {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      if (cancelled) return;

      const region = document.getElementById(QR_REGION_ID);
      if (!region) {
        setError("No se encontró el visor QR. Probá de nuevo.");
        setScanning(false);
        return;
      }
      region.innerHTML = "";

      try {
        const html5 = new Html5Qrcode(QR_REGION_ID, { verbose: false });
        scannerRef.current = html5;

        const scanConfig = {
          fps: 10,
          qrbox: (viewWidth: number, viewHeight: number) => {
            const edge = Math.min(viewWidth, viewHeight, 320);
            const box = Math.max(200, Math.floor(edge * 0.72));
            return { width: box, height: box };
          },
        };

        const onDecoded = async (decodedText: string) => {
          if (cancelled || scanHandledRef.current) return;
          scanHandledRef.current = true;
          cancelled = true;
          await stopScanner();
          setScanning(false);
          const normalized = decodedText.trim().toUpperCase();
          void validateCode(normalized);
        };

        const onScanError = () => {
          /* frames sin QR: ignorar */
        };

        try {
          await html5.start({ facingMode: { ideal: "environment" } }, scanConfig, onDecoded, onScanError);
        } catch (firstErr) {
          console.warn("[QR] ideal environment falló, probando cámara por id:", firstErr);
          try {
            if (html5.isScanning) await html5.stop();
          } catch {
            /* */
          }
          try {
            html5.clear();
          } catch {
            /* */
          }
          region.innerHTML = "";
          const cameras = await Html5Qrcode.getCameras();
          const camId = pickRearCameraId(cameras);
          if (!camId) throw new Error("No se detectó ninguna cámara");
          const html5b = new Html5Qrcode(QR_REGION_ID, { verbose: false });
          scannerRef.current = html5b;
          await html5b.start(camId, scanConfig, onDecoded, onScanError);
        }
      } catch (e) {
        console.error("[QR] arranque cámara:", e);
        await stopScanner();
        const msg =
          e instanceof Error ? e.message : "Error desconocido";
        setError(
          `No se pudo usar la cámara (${msg}). En el teléfono: permití acceso a la cámara, usá HTTPS, y si el navegador ofrece elegir cámara, elegí la trasera.`
        );
        setScanning(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [scanning, validateCode]);

  async function cancelScanning() {
    const instance = scannerRef.current;
    scannerRef.current = null;
    if (instance) {
      try {
        if (instance.isScanning) await instance.stop();
      } catch {
        /* */
      }
      try {
        instance.clear();
      } catch {
        /* */
      }
    }
    const region = document.getElementById(QR_REGION_ID);
    if (region) region.innerHTML = "";
    setScanning(false);
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
        const data = await res.json().catch(() => ({}));
        let msg = "Pedido marcado como entregado ✅";
        if (data.thankYouEmailSent === false) {
          msg +=
            "\n\nNo se pudo enviar el email de agradecimiento al cliente (revisá Resend).";
        }
        alert(msg);
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
            <p className="mb-3 text-center text-sm text-gray-600">
              Usá la <strong>cámara trasera</strong> para enfocar el código. Si el navegador pide permiso, aceptalo.
            </p>
            <div id={QR_REGION_ID} className="w-full overflow-hidden rounded-lg bg-black/5" />
            <button
              type="button"
              onClick={() => void cancelScanning()}
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
                  <span>
                    {orderItemProductName(item)} x{item.quantity}
                  </span>
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
