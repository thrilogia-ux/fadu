"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";

interface Order {
  id: string;
  pickupCode: string;
  status: string;
  total: number;
  createdAt: string;
  items: { product: { name: string }; quantity: number }[];
}

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

export default function MisPedidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/cuenta/pedidos");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((data) => {
          setOrders(Array.isArray(data) ? data : []);
          setLoading(false);
        });
    }
  }, [session]);

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Header categories={[]} />

      <main className="min-h-screen overflow-x-hidden bg-gray-50 py-6 pb-12 md:py-8">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 overflow-x-auto pb-1 text-sm text-gray-600">
            <Link href="/" className="shrink-0 hover:underline">Inicio</Link>
            <span>/</span>
            <Link href="/cuenta" className="hover:underline">Mi cuenta</Link>
            <span>/</span>
            <span className="text-[#1d1d1b]">Mis compras</span>
          </nav>

          <h1 className="mb-6 text-center text-2xl font-bold text-[#1d1d1b] md:mb-8 md:text-left md:text-3xl">Mis compras</h1>

          {orders.length === 0 ? (
            <div className="rounded-lg border border-black/8 bg-white p-12 text-center">
              <div className="mb-4 text-6xl">📦</div>
              <h2 className="mb-2 text-xl font-semibold">No tenés compras todavía</h2>
              <p className="mb-6 text-gray-600">
                Cuando hagas tu primera compra, va a aparecer acá
              </p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-[#0f3bff] px-6 py-3 font-semibold text-white hover:bg-[#0d32cc]"
              >
                Empezar a comprar
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/pedido/${order.id}`}
                  className="block rounded-lg border border-black/8 bg-white p-6 transition hover:shadow-lg"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="font-mono font-bold shrink-0">#{order.pickupCode}</span>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-700">
                        {order.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", ")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold">
                        ${Number(order.total).toLocaleString("es-AR")}
                      </p>
                      <p className="mt-1 text-sm text-[#0f3bff]">Ver detalle →</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
