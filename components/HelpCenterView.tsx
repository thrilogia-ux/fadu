"use client";

import { useState } from "react";
import Link from "next/link";
import { STORE_NAME } from "@/lib/brand";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PickupPromoBanner } from "@/components/PickupPromoBanner";
import { BrandIcon } from "@/components/BrandIcon";
import type { BrandIconName } from "@/lib/brand-icons";
import type { LegalPageMeta } from "@/lib/legal-pages";
import type { PickupInfo } from "@/lib/pickup";

type FaqItem = { question: string; answer: string };

type Props = {
  faqPage: LegalPageMeta;
  faqItems: FaqItem[];
  categories: { id: string; name: string; slug: string }[];
  pickup: PickupInfo;
};

const QUICK_LINKS: {
  href: string;
  label: string;
  icon?: BrandIconName;
  emoji?: string;
  desc: string;
}[] = [
  { href: "/ayuda/comprar", label: "Cómo comprar", icon: "carrito", desc: "Paso a paso" },
  { href: "/retiro", label: "Retiro en FADU", icon: "retiroFadu", desc: "Horarios y ubicación" },
  { href: "/medios-de-pago", label: "Medios de pago", icon: "tarjetas", desc: "MP y transferencia" },
  { href: "/ayuda/devoluciones", label: "Devoluciones", emoji: "↩️", desc: "Cambios y reembolsos" },
];

const STEPS = [
  {
    n: 1,
    icon: "🛍️",
    title: "Elegí tus productos",
    text: "Navegá el catálogo, elegí talle o color si aplica y agregá al carrito.",
  },
  {
    n: 2,
    icon: "🔐",
    title: "Iniciá sesión y pagá",
    text: "Creá tu cuenta o entrá con Google. Pagá con Mercado Pago o transferencia.",
  },
  {
    n: 3,
    icon: "📧",
    title: "Esperá el aviso",
    text: "Te enviamos un email cuando tu pedido esté listo para retirar.",
  },
  {
    n: 4,
    icon: "📱",
    title: "Retirá en FADU",
    text: "Presentá el QR del mail o tu código de pedido en el Pickup Point.",
  },
];

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-xl border border-black/8 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition hover:bg-gray-50 sm:px-5"
              aria-expanded={open}
            >
              <span className="font-semibold text-[#1d1d1b]">{item.question}</span>
              <span
                className={`mt-0.5 shrink-0 text-[#0f3bff] transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▾
              </span>
            </button>
            {open ? (
              <div className="border-t border-black/8 px-4 pb-4 pt-2 text-sm leading-relaxed text-gray-700 sm:px-5">
                <p className="whitespace-pre-line">{item.answer}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function HelpCenterView({ faqPage, faqItems, categories, pickup }: Props) {
  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen bg-gray-50 py-8 md:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <nav className="mb-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#0f3bff] hover:underline">
              Inicio
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#1d1d1b]">Ayuda</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1d1d1b] md:text-3xl">{faqPage.title}</h1>
            <p className="mt-2 text-gray-600">
              Todo lo que necesitás saber para comprar y retirar en {STORE_NAME}.
            </p>
          </div>

          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-[#0f3bff]/30 hover:shadow-md"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center" aria-hidden>
                  {link.icon ? (
                    <BrandIcon name={link.icon} size={32} />
                  ) : (
                    <span className="text-2xl">{link.emoji}</span>
                  )}
                </span>
                <p className="mt-2 text-sm font-semibold text-[#1d1d1b]">{link.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{link.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-[#1d1d1b] md:text-xl">Cómo funciona</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {STEPS.map((step) => (
                <div
                  key={step.n}
                  className="flex gap-4 rounded-xl border border-black/8 bg-white p-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f3bff]/10 text-lg">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#0f3bff]">
                      Paso {step.n}
                    </p>
                    <h3 className="font-semibold text-[#1d1d1b]">{step.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <PickupPromoBanner pickup={pickup} compact />
          </div>

          <div className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-[#1d1d1b] md:text-xl">Preguntas frecuentes</h2>
            <FaqAccordion items={faqItems} />
          </div>

          <p className="text-center text-sm text-gray-500">
            ¿Seguís con dudas?{" "}
            <a
              href={buildWhatsAppUrl(`Hola, consulta desde ${STORE_NAME}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#0f3bff] hover:underline"
            >
              Escribinos por WhatsApp
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
