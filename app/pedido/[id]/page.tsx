"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { formatVariantLabel } from "@/lib/cart-line";
import { orderItemProductName } from "@/lib/order-item-display";
import { PickupScheduleDisplay } from "@/components/PickupScheduleDisplay";
import { WhatsAppOrderLink } from "@/components/WhatsAppOrderLink";
import { BrandLoader } from "@/components/BrandLoader";
import { CheckoutSteps } from "@/components/CheckoutSteps";
import { ReorderButton } from "@/components/ReorderButton";
import { STORE_TRANSFER_ALIAS } from "@/lib/brand";
import type { PickupInfo } from "@/lib/pickup";

interface Order {
  id: string;
  pickupCode: string;
  status: string;
  paymentMethod: string;
  total: number;
  discountTotal?: number;
  createdAt: string;
  items: {
    product: { name: string } | null;
    productNameSnapshot?: string | null;
    quantity: number;
    price: number;
    variantSizeLabel?: string | null;
    variantColorLabel?: string | null;
  }[];
}

export default function PedidoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const [order, setOrder] = useState<Order | null>(null);
  const [pickupInfo, setPickupInfo] = useState<PickupInfo | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/orders/${params.id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/pickup-info").then((r) => r.json()),
    ])
      .then(([orderData, categoriesData, pickupData]) => {
        setOrder(orderData);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        if (pickupData && !pickupData.error) setPickupInfo(pickupData);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Header categories={[]} />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-2xl px-4">
            <BrandLoader fullScreen size="lg" label="Cargando pedido…" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header categories={categories} />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-gray-600">Pedido no encontrado</p>
            <Link href="/" className="text-[#0f3bff] hover:underline">
              Volver al inicio
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isPendingPayment = order.status === "pending_payment";
  const isTransfer = order.paymentMethod === "transfer";
  const isTest = order.paymentMethod === "test";
  const isFeriaPresencial = order.paymentMethod === "feria_presencial";

  const statusLabels: Record<string, string> = {
    pending_payment: "Pendiente de pago",
    paid: "Pagado",
    preparing: "Preparando",
    ready_for_pickup: "Listo para retirar",
    completed: "Completado",
    cancelled: "Cancelado",
  };
  const statusColors: Record<string, string> = {
    pending_payment: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    ready_for_pickup: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen overflow-x-hidden bg-gray-50 py-6 pb-12 md:py-8">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
          {success ? <CheckoutSteps current={3} /> : null}
          {success && (
            <div className="mb-6 rounded-xl border-2 border-green-300 bg-green-50 p-8 text-center shadow-sm">
              <div className="mb-4 text-5xl">✅</div>
              <h2 className="mb-3 text-2xl font-bold text-green-800">
                ¡Gracias por tu compra!
              </h2>
              <p className="mb-2 text-lg font-semibold text-green-800">
                Tu compra se realizó con éxito.
              </p>
              <p className="text-green-700">
                {isFeriaPresencial
                  ? "Tu compra quedó registrada y te llevaste el producto en el stand. Te enviamos un email de confirmación."
                  : isTest
                    ? "Simulación completada. Revisá tu email para ver los correos de prueba (confirmación + QR para retiro)."
                    : isTransfer
                      ? "Te enviamos un email con los datos de transferencia. Una vez confirmado el pago, te avisaremos cuando tu pedido esté listo para retirar en FADU."
                      : order.status === "ready_for_pickup"
                        ? "Te enviamos un email con el código QR para retirar tu pedido en el Pickup Point de FADU."
                        : "Te avisaremos por email cuando tu pedido esté listo para retirar en FADU."}
              </p>
            </div>
          )}

          <div className="min-w-0 rounded-lg border border-black/8 bg-white p-4 sm:p-6">
            <div className="mb-6 border-b border-black/8 pb-6">
              <h1 className="mb-2 text-2xl font-bold">Pedido #{order.pickupCode}</h1>
              <p className="text-sm text-gray-600">
                Fecha: {new Date(order.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>

            {/* Estado */}
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-600">Estado</h3>
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                  statusColors[order.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {statusLabels[order.status] || order.status}
              </span>
            </div>

            {/* Datos de transferencia si aplica */}
            {isTransfer && isPendingPayment && (
              <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-4 text-lg font-bold text-blue-900">
                  Datos para transferencia
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">CBU:</span> 0000003100010000000000
                  </div>
                  <div>
                    <span className="font-semibold">Alias:</span> {STORE_TRANSFER_ALIAS}
                  </div>
                  <div>
                    <span className="font-semibold">Titular:</span> FADU S.A.
                  </div>
                  <div>
                    <span className="font-semibold">Monto:</span> $
                    {Number(order.total).toLocaleString("es-AR")}
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="font-semibold text-blue-900">
                      Concepto: Pedido {order.pickupCode}
                    </p>
                    <p className="mt-2 text-xs text-blue-700">
                      Importante: Incluí el código de pedido en el concepto de la transferencia
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-blue-700">
                  Una vez que confirmemos tu pago, te avisaremos por email cuando tu pedido esté
                  listo para retirar en FADU.
                </p>
              </div>
            )}

            {/* Productos */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-600">Productos</h3>
              <div className="space-y-2">
                {order.items.map((item, idx) => {
                  const vNote = formatVariantLabel(
                    item.variantSizeLabel ?? "",
                    item.variantColorLabel ?? "",
                    {
                      showSize: Boolean(item.variantSizeLabel?.trim()),
                      showColor: Boolean(item.variantColorLabel?.trim()),
                    }
                  );
                  return (
                    <div key={idx} className="flex min-w-0 justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">
                        {orderItemProductName(item)}
                        {vNote ? ` (${vNote})` : ""} x{item.quantity}
                      </span>
                      <span className="font-semibold shrink-0">
                        ${(Number(item.price) * item.quantity).toLocaleString("es-AR")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="mb-6 space-y-2 border-t border-black/8 pt-4">
              {Number(order.discountTotal ?? 0) > 0 && (
                <>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>
                      $
                      {(
                        Number(order.total) + Number(order.discountTotal ?? 0)
                      ).toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento</span>
                    <span>-${Number(order.discountTotal).toLocaleString("es-AR")}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${Number(order.total).toLocaleString("es-AR")}</span>
              </div>
            </div>

            {/* Retiro / entrega */}
            {isFeriaPresencial ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
                <h3 className="mb-2 font-semibold text-emerald-950">Entrega en feria</h3>
                <p className="text-sm leading-relaxed text-emerald-900">
                  Este pedido fue entregado en el stand de la feria. No requiere retiro en FADU ni código QR.
                </p>
              </div>
            ) : (
            <div className="rounded-xl border border-black/8 bg-gray-50 p-4 sm:p-5">
              <h3 className="mb-2 font-semibold text-[#1d1d1b]">Retiro en FADU</h3>
              <p className="mb-4 text-sm leading-relaxed text-gray-700">
                {order.status === "ready_for_pickup" || order.status === "completed"
                  ? "Tu pedido está listo. Presentá el código QR del email o tu número de pedido al retirar."
                  : "Cuando tu pedido esté listo, recibirás un email con un código QR para retirarlo en FADU."}
              </p>
              {pickupInfo ? (
                <PickupScheduleDisplay info={pickupInfo} showNotes className="mb-4" />
              ) : (
                <p className="mb-4 text-sm text-gray-600">Cargando horarios...</p>
              )}
              <div className="flex flex-col gap-3 border-t border-black/8 pt-4">
                {(order.status === "ready_for_pickup" || order.status === "completed") &&
                  pickupInfo && (
                    <WhatsAppOrderLink
                      pickupCode={order.pickupCode}
                      scheduleLines={pickupInfo.scheduleLines}
                      address={pickupInfo.address}
                      className="w-full"
                    />
                  )}
                <Link
                  href="/retiro"
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-black/12 bg-white px-4 text-sm font-medium text-[#0f3bff] transition hover:bg-[#0f3bff]/5"
                >
                  Más info sobre el retiro
                </Link>
              </div>
            </div>
            )}

            {/* Acciones */}
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-semibold text-gray-600">¿Qué querés hacer ahora?</h3>

              <Link
                href="/cuenta/pedidos"
                className="flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#0f3bff] px-4 text-sm font-semibold text-white transition hover:bg-[#0d32cc] active:bg-[#0a28a8]"
              >
                Ver mis pedidos
              </Link>

              {(order.status === "ready_for_pickup" || order.status === "completed") &&
              order.pickupCode &&
              !isFeriaPresencial ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReorderButton orderId={order.id} className="w-full" />
                  <a
                    href={`/api/orders/${order.id}/qr`}
                    download
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-black/15 bg-white px-4 text-center text-sm font-semibold text-[#1d1d1b] transition hover:bg-gray-50"
                  >
                    Descargar QR de retiro
                  </a>
                </div>
              ) : (
                <ReorderButton orderId={order.id} className="w-full" />
              )}

              <Link
                href="/"
                className="flex min-h-[48px] w-full items-center justify-center rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Volver a la tienda
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
