import Link from "next/link";
import Image from "next/image";
import { PickupScheduleDisplay } from "@/components/PickupScheduleDisplay";
import type { PickupInfo } from "@/lib/pickup";

type Props = {
  pickup: PickupInfo;
  compact?: boolean;
};

export function PickupPromoBanner({ pickup, compact = false }: Props) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-black/8 bg-white shadow-sm ${compact ? "" : "md:rounded-2xl"}`}
      aria-labelledby="pickup-promo-title"
    >
      <div className={`grid ${compact ? "md:grid-cols-[1fr_1.2fr]" : "md:grid-cols-2"}`}>
        <div className="relative min-h-[180px] bg-gradient-to-br from-[#0f3bff]/15 via-[#e6f0ff] to-gray-100 md:min-h-[240px]">
          <Image
            src="/pickup.png"
            alt="Pickup Point FADU — retirá tu compra en la facultad"
            fill
            className="object-contain p-6 md:p-8"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
        </div>
        <div className="flex flex-col justify-center p-5 md:p-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#0f3bff]">
            Retiro en FADU
          </p>
          <h2 id="pickup-promo-title" className="mb-2 text-xl font-bold text-[#1d1d1b] md:text-2xl">
            ¿Cómo retirar tu pedido?
          </h2>
          <p className="mb-4 text-sm text-gray-600 md:text-base">
            Comprás online, te avisamos por email cuando esté listo y retirás en el Pickup Point
            presentando el QR o tu código de pedido.
          </p>
          {!compact && (
            <div className="mb-4 rounded-lg bg-[#0f3bff]/5 p-4">
              <PickupScheduleDisplay info={pickup} />
            </div>
          )}
          <div className="mt-auto flex flex-col gap-2 sm:flex-row">
            <Link
              href="/retiro"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#0f3bff] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d32cc]"
            >
              Ver guía de retiro
            </Link>
            <Link
              href="/ayuda"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-black/15 px-5 py-2.5 text-sm font-semibold text-[#1d1d1b] transition hover:bg-gray-50"
            >
              Preguntas frecuentes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
