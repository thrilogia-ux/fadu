"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { STORE_NAME } from "@/lib/brand";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session || (session.user as any).role !== "admin") {
    return null;
  }

  const sections = [
    {
      title: "Pedidos",
      description: "Gestionar pedidos y cambiar estados",
      href: "/admin/pedidos",
      icon: "📦",
    },
    {
      title: "Validar retiro",
      description: "Escanear QR y marcar como entregado",
      href: "/admin/validar-retiro",
      icon: "✅",
    },
    {
      title: "Retiro y horarios",
      description: "Días y horarios del Pickup Point",
      href: "/admin/retiro",
      icon: "🕐",
    },
    {
      title: "Productos",
      description: "Agregar, editar y eliminar productos",
      href: "/admin/productos",
      icon: "🏷️",
    },
    {
      title: "Categorías",
      description: "Administrar categorías del sitio",
      href: "/admin/categorias",
      icon: "📂",
    },
    {
      title: "Cupones",
      description: "Crear y gestionar cupones de descuento",
      href: "/admin/cupones",
      icon: "🎟️",
    },
    {
      title: "Portada",
      description: "Ordenar destacados y ofertas del home",
      href: "/admin/portada",
      icon: "🏠",
    },
    {
      title: "Hero Slides",
      description: "Gestionar los banners del home",
      href: "/admin/hero",
      icon: "🖼️",
    },
    {
      title: "Franja superior",
      description: "Mensajes de la barra azul (marquesina del header)",
      href: "/admin/franja-superior",
      icon: "📣",
    },
    {
      title: "Preguntas",
      description: "Responder preguntas de clientes",
      href: "/admin/preguntas",
      icon: "💬",
    },
    {
      title: "Opiniones",
      description: "Aprobar o rechazar reseñas",
      href: "/admin/reseñas",
      icon: "⭐",
    },
    {
      title: "Bundles",
      description: "Packs fijos y combos con descuento",
      href: "/admin/bundles",
      icon: "🎁",
    },
    {
      title: "Páginas legales",
      description: "Ayuda, términos, privacidad y medios de pago",
      href: "/admin/legales",
      icon: "📄",
    },
    {
      title: "Perfiles",
      description: "Avatares que eligen los usuarios en su cuenta",
      href: "/admin/perfiles",
      icon: "👤",
    },
    {
      title: "Modo feria",
      description: "Checkout rápido en eventos y ferias",
      href: "/admin/feria",
      icon: "🎪",
    },
    {
      title: "Newsletter",
      description: "Ver suscriptores del newsletter",
      href: "/admin/newsletter",
      icon: "📧",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Panel Admin — {STORE_NAME}</h1>
            <Link href="/" className="text-sm text-[#0f3bff] hover:underline">
              Ver sitio →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group block rounded-lg border border-black/10 bg-white p-6 transition hover:shadow-lg"
            >
              <div className="mb-3 text-4xl">{section.icon}</div>
              <h2 className="mb-2 text-lg font-bold text-[#1d1d1b] group-hover:text-[#0f3bff]">
                {section.title}
              </h2>
              <p className="text-sm text-gray-600">{section.description}</p>
            </Link>
          ))}
        </div>

        <Link
          href="/admin/finanzas"
          className="mt-10 block rounded-xl border-2 border-[#0f3bff]/30 bg-gradient-to-r from-[#0f3bff]/10 to-indigo-500/10 p-8 transition hover:border-[#0f3bff] hover:shadow-lg"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-3xl">💰</div>
              <h2 className="text-xl font-bold text-[#1d1d1b]">Administración financiera</h2>
              <p className="mt-1 text-sm text-gray-600">
                Liquidación mensual, costos de producto, gastos operativos, comisiones y conciliación con facturación
              </p>
            </div>
            <span className="text-sm font-semibold text-[#0f3bff]">Ir al módulo →</span>
          </div>
        </Link>
      </main>
    </div>
  );
}
