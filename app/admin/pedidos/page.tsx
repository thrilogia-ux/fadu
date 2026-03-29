"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Order {
  id: string;
  pickupCode: string | null;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  archived: boolean;
  user: { name: string | null; email: string };
  _count: { items: number };
}

type ListMode = "active" | "archived" | "all";

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
  const [listMode, setListMode] = useState<ListMode>("active");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/pedidos");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    setSelectedIds([]);
  }, [listMode]);

  useEffect(() => {
    if (session && (session.user as any).role === "admin") {
      loadOrders();
    }
  }, [session, listMode]);

  async function loadOrders() {
    setLoading(true);
    try {
      const archivedParam =
        listMode === "active" ? "false" : listMode === "archived" ? "true" : "all";
      const res = await fetch(`/api/admin/orders?archived=${archivedParam}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
    setLoading(false);
  }

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAllVisible() {
    const ids = filteredOrders.map((o) => o.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  }

  async function bulkAction(action: "archive" | "restore" | "delete") {
    if (selectedIds.length === 0) return;
    if (action === "delete") {
      const ok = confirm(
        `¿Eliminar ${selectedIds.length} pedido(s) de forma permanente? Se borrarán ítems e historial. No se puede deshacer.`
      );
      if (!ok) return;
    } else {
      const label =
        action === "archive"
          ? `¿Archivar ${selectedIds.length} pedido(s)? Desaparecerán de la lista del cliente y de retiros hasta restaurarlos.`
          : `¿Restaurar ${selectedIds.length} pedido(s)?`;
      if (!confirm(label)) return;
    }

    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSelectedIds([]);
        loadOrders();
      } else {
        alert(typeof data.error === "string" ? data.error : "Error al procesar");
      }
    } catch {
      alert("Error de conexión");
    }
  }

  async function changeStatus(orderId: string, newStatus: string) {
    if (!confirm(`¿Cambiar estado a "${statusLabels[newStatus]}"?`)) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (newStatus === "ready_for_pickup" && data.pickupReadyEmailSent === false) {
          const detail =
            typeof data.pickupReadyEmailError === "string" && data.pickupReadyEmailError.trim()
              ? `\n\nDetalle: ${data.pickupReadyEmailError}`
              : "";
          alert(
            "Estado actualizado, pero no se envió el email con el QR. Revisá Resend (API key, dominio verificado), RESEND_TEST_TO si probás, y que el cliente tenga email en la cuenta." +
              detail
          );
        }
        loadOrders();
      } else {
        const msg =
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : `Error al cambiar estado (${res.status})`;
        alert(msg);
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
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-black/8 pb-4">
          <span className="mr-2 text-sm font-medium text-gray-600">Vista:</span>
          {(
            [
              ["active", "Activos"],
              ["archived", "Archivados"],
              ["all", "Todos"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setListMode(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                listMode === key ? "bg-gray-800 text-white" : "bg-white text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtros por estado */}
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

        {filteredOrders.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-black/8 bg-white px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={
                  filteredOrders.length > 0 &&
                  filteredOrders.every((o) => selectedIds.includes(o.id))
                }
                ref={(el) => {
                  if (el) {
                    const some = filteredOrders.some((o) => selectedIds.includes(o.id));
                    el.indeterminate =
                      some && !filteredOrders.every((o) => selectedIds.includes(o.id));
                  }
                }}
                onChange={toggleSelectAllVisible}
              />
              Seleccionar visibles ({selectedIds.length} elegidos)
            </label>
            <span className="hidden sm:inline text-gray-300">|</span>
            <button
              type="button"
              onClick={() => bulkAction("archive")}
              disabled={selectedIds.length === 0}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Archivar
            </button>
            <button
              type="button"
              onClick={() => bulkAction("restore")}
              disabled={selectedIds.length === 0}
              className="rounded-lg bg-slate-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Restaurar
            </button>
            <button
              type="button"
              onClick={() => bulkAction("delete")}
              disabled={selectedIds.length === 0}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Eliminar definitivamente
            </button>
          </div>
        )}

        {/* Lista */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-lg border border-black/8 bg-white p-12 text-center text-gray-600">
              No hay pedidos
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`rounded-lg border border-black/8 bg-white p-6 ${order.archived ? "opacity-90 ring-1 ring-amber-200/80" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <label className="flex shrink-0 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-gray-300"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => toggleSelect(order.id)}
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold">#{order.pickupCode || order.id.slice(0, 8)}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                      {order.archived && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                          Archivado
                        </span>
                      )}
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

                  <div className="flex flex-shrink-0 flex-wrap gap-2">
                    {!order.archived && order.status === "pending_payment" && (
                      <button
                        type="button"
                        onClick={() => changeStatus(order.id, "paid")}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Pago realizado
                      </button>
                    )}
                    {!order.archived && order.status === "paid" && (
                      <>
                        <button
                          type="button"
                          onClick={() => changeStatus(order.id, "preparing")}
                          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                        >
                          Preparar
                        </button>
                        <button
                          type="button"
                          onClick={() => changeStatus(order.id, "ready_for_pickup")}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Listo para retirar
                        </button>
                      </>
                    )}
                    {!order.archived && order.status === "preparing" && (
                      <button
                        type="button"
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
