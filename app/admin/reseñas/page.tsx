"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  user: { name: string | null; email: string };
  product: { name: string; slug: string };
}

export default function AdminResenasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/reseñas");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as any).role === "admin") {
      loadReviews();
    }
  }, [session, filter]);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${filter}`);
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadReviews();
      } else {
        alert("Error al actualizar");
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Opiniones</h1>
            </div>
            <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
              ← Volver al panel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Filtros */}
        <div className="mb-6 flex gap-2">
          {["pending", "approved", "rejected", "all"].map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                filter === key ? "bg-[#0f3bff] text-white" : "bg-white text-gray-700"
              }`}
            >
              {key === "pending" && "Pendientes"}
              {key === "approved" && "Aprobadas"}
              {key === "rejected" && "Rechazadas"}
              {key === "all" && "Todas"}
            </button>
          ))}
        </div>

        {/* Lista */}
        {reviews.length === 0 ? (
          <div className="rounded-lg border border-black/8 bg-white p-12 text-center text-gray-600">
            No hay opiniones para mostrar
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-black/8 bg-white p-6">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <Link
                      href={`/producto/${r.product.slug}`}
                      className="text-sm font-semibold text-[#0f3bff] hover:underline"
                    >
                      {r.product.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {r.user.name || r.user.email} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                    {r.status}
                  </span>
                </div>

                <div className="mb-2 text-yellow-500">
                  {"★".repeat(r.rating)}
                  <span className="text-gray-300">{"★".repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className="text-gray-800">{r.comment}</p>}

                {r.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => updateStatus(r.id, "approved")}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "rejected")}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
