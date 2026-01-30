"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";

interface Order {
  id: string;
  pickupCode: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: { product: { name: string }; quantity: number; price: number }[];
}

export default function PedidoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const [order, setOrder] = useState<Order | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/orders/${params.id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([orderData, categoriesData]) => {
        setOrder(orderData);
        setCategories(categoriesData);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
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

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen overflow-x-hidden bg-gray-50 py-6 pb-12 md:py-8">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
              <div className="mb-2 text-4xl">✅</div>
              <h2 className="mb-2 text-xl font-bold text-green-800">¡Pedido confirmado!</h2>
              <p className="text-green-700">
                {isTransfer
                  ? "Te enviamos los datos de transferencia por email"
                  : "Te avisaremos cuando esté listo para retirar"}
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
              <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
                {isPendingPayment ? "Pendiente de pago" : order.status}
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
                    <span className="font-semibold">Alias:</span> FADU.STORE
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
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex min-w-0 justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-semibold shrink-0">
                      ${(Number(item.price) * item.quantity).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="mb-6 flex justify-between border-t border-black/8 pt-4 text-xl font-bold">
              <span>Total</span>
              <span>${Number(order.total).toLocaleString("es-AR")}</span>
            </div>

            {/* Retiro */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold">📍 Retiro en FADU</h3>
              <p className="text-sm text-gray-700">
                Una vez que tu pedido esté listo, recibirás un email con un código QR para
                retirarlo en FADU.
              </p>
              <p className="mt-2 text-xs text-gray-600">
                Dirección: Av. San Juan 350, CABA
                <br />
                Horarios: Lunes a viernes de 10 a 18 hs
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="flex-1 rounded-lg border border-black/20 py-3 text-center font-semibold hover:bg-black/5"
              >
                Volver al inicio
              </Link>
              <Link
                href="/cuenta/pedidos"
                className="flex-1 rounded-lg bg-[#0f3bff] py-3 text-center font-semibold text-white hover:bg-[#0d32cc]"
              >
                Ver mis pedidos
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
