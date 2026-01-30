"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Order {
  id: string;
  pickupCode: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  user: { name: string | null; email: string };
  _count: { items: number };
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

export default function AdminPedidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/pedidos");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as any).role === "admin") {
      loadOrders();
    }
  }, [session]);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
    setLoading(false);
  }

  async function changeStatus(orderId: string, newStatus: string) {
    if (!confirm(`¿Cambiar estado a "${statusLabels[newStatus]}"?`)) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        loadOrders();
      } else {
        alert("Error al cambiar estado");
      }
    } catch {
      alert("Error de conexión");
    }
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session || (session.user as any).role !== "admin") {
    return null;
  }

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>
            <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
              ← Volver al panel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === "all" ? "bg-[#0f3bff] text-white" : "bg-white text-gray-700"
            }`}
          >
            Todos ({orders.length})
          </button>
          {Object.entries(statusLabels).map(([key, label]) => {
            const count = orders.filter((o) => o.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === key ? "bg-[#0f3bff] text-white" : "bg-white text-gray-700"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Lista */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-lg border border-black/8 bg-white p-12 text-center text-gray-600">
              No hay pedidos
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="rounded-lg border border-black/8 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-bold">#{order.pickupCode}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Cliente: {order.user.name || order.user.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleString("es-AR")}
                    </p>
                    <p className="mt-2 font-semibold">
                      ${Number(order.total).toLocaleString("es-AR")} — {order._count.items}{" "}
                      producto(s)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "pending_payment" && order.paymentMethod === "transfer" && (
                      <button
                        onClick={() => changeStatus(order.id, "paid")}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Marcar pagado
                      </button>
                    )}
                    {order.status === "paid" && (
                      <button
                        onClick={() => changeStatus(order.id, "preparing")}
                        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                      >
                        Preparar
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button
                        onClick={() => changeStatus(order.id, "ready_for_pickup")}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Listo para retirar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
