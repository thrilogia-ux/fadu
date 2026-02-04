"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export default function AdminNewsletterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/newsletter");
    } else if (session && (session.user as { role?: string }).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") {
      loadSubscribers();
    }
  }, [session]);

  async function loadSubscribers() {
    try {
      const res = await fetch("/api/admin/newsletter");
      if (res.ok) {
        setSubscribers(await res.json());
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
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
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Newsletter</h1>
              <p className="text-sm text-gray-600 mt-1">
                {subscribers.length} suscriptor{subscribers.length !== 1 ? "es" : ""}
              </p>
            </div>
            <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
              ← Volver al panel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {subscribers.length === 0 ? (
          <div className="rounded-lg border border-black/8 bg-white p-12 text-center text-gray-600">
            Aún no hay suscriptores
          </div>
        ) : (
          <div className="rounded-lg border border-black/8 bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-black/8">
                <tr>
                  <th className="px-6 py-4 font-semibold text-[#1d1d1b]">Email</th>
                  <th className="px-6 py-4 font-semibold text-[#1d1d1b]">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id} className="border-b border-black/5 last:border-0">
                    <td className="px-6 py-4">{s.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
