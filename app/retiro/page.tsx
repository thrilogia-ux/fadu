import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PickupScheduleDisplay } from "@/components/PickupScheduleDisplay";
import { PickupStepsGuide } from "@/components/PickupStepsGuide";
import { BrandIcon } from "@/components/BrandIcon";
import { getAllActiveCategories } from "@/lib/home-data";
import { getPickupInfo } from "@/lib/pickup";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function RetiroPage() {
  const [categories, pickup] = await Promise.all([
    getAllActiveCategories(),
    getPickupInfo(),
  ]);

  const consultaUrl = buildWhatsAppUrl(
    `Hola! Quiero consultar sobre el retiro de mi pedido en FADU.\n\nHorarios:\n${pickup.scheduleLines.map((l) => `• ${l}`).join("\n")}`
  );

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen bg-gray-50 py-8 md:py-12">
        <div className="mx-auto max-w-5xl px-4">
          <nav className="mb-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#0f3bff] hover:underline">
              Inicio
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#1d1d1b]">Retiro en FADU</span>
          </nav>

          <div className="rounded-xl border border-black/8 bg-white p-6 shadow-sm md:p-8">
            <h1 className="mb-2 text-2xl font-bold text-[#1d1d1b] md:text-3xl">
              Pickup Point FADU
            </h1>
            <p className="mb-6 text-gray-600">
              Retirá tu compra en la Facultad de Arquitectura, Diseño y Urbanismo (UBA).
              Cuando tu pedido esté listo, recibirás un email con el código QR.
            </p>

            <div className="mb-6 rounded-lg bg-[#0f3bff]/5 p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-[#1d1d1b]">
                <BrandIcon name="retiroFadu" size={24} className="shrink-0" />
                Dónde y cuándo
              </h2>
              <PickupScheduleDisplay info={pickup} />
            </div>

            <PickupStepsGuide />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={consultaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#1ebe57]"
              >
                Consultar por WhatsApp
              </a>
              <Link
                href="/cuenta/pedidos"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-black/15 px-4 py-3 text-center text-sm font-semibold hover:bg-black/5"
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
