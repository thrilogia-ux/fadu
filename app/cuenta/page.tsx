"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { BrandIcon } from "@/components/BrandIcon";
import type { BrandIconName } from "@/lib/brand-icons";

export default function CuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/cuenta");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session) {
    return null;
  }

  const menuItems: {
    title: string;
    description: string;
    href: string;
    icon?: BrandIconName;
    emoji?: string;
  }[] = [
    {
      title: "Mis compras",
      description: "Revisá el estado de tus pedidos",
      href: "/cuenta/pedidos",
      icon: "misCompras",
    },
    {
      title: "Favoritos",
      description: "Productos que guardaste",
      href: "/cuenta/favoritos",
      emoji: "❤️",
    },
    {
      title: "Mis datos",
      description: "Administrá tu información personal",
      href: "/cuenta/perfil",
      icon: "perfil",
    },
  ];

  return (
    <>
      <Header categories={[]} />

      <main className="min-h-screen overflow-x-hidden bg-gray-50 py-6 pb-12 md:py-8">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0f3bff] text-2xl text-white">
                {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1d1d1b]">
                  ¡Hola, {session.user?.name || "Usuario"}!
                </h1>
                <p className="text-gray-600">{session.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="grid gap-4 md:grid-cols-3">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg border border-black/8 bg-white p-6 transition hover:shadow-lg"
              >
                <div className="mb-3">
                  {item.icon ? (
                    <BrandIcon name={item.icon} size={48} />
                  ) : (
                    <span className="text-3xl" aria-hidden>
                      {item.emoji}
                    </span>
                  )}
                </div>
                <h2 className="mb-1 text-lg font-semibold text-[#1d1d1b] group-hover:text-[#0f3bff]">
                  {item.title}
                </h2>
                <p className="text-sm text-gray-600">{item.description}</p>
              </Link>
            ))}
          </div>

          {/* Admin link */}
          {(session.user as any).role === "admin" && (
            <div className="mt-6">
              <Link
                href="/admin"
                className="block rounded-lg border-2 border-[#0f3bff] bg-[#0f3bff]/5 p-6 text-center hover:bg-[#0f3bff]/10"
              >
                <span className="text-lg font-semibold text-[#0f3bff]">
                  🔧 Panel de administración
                </span>
              </Link>
            </div>
          )}

          {/* Cerrar sesión */}
          <div className="mt-6 text-center">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-gray-600 hover:text-red-600 hover:underline"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
