import Image from "next/image";

const STEPS = [
  {
    image: "/retiro-paso-1.png",
    title: "Comprá online",
    description: "Elegí tus productos y seleccioná retiro en el Pickup Point FADU al finalizar la compra.",
  },
  {
    image: "/retiro-paso-2.png",
    title: "Recibí el aviso",
    description: "Te enviamos un email cuando tu pedido esté listo, con el código QR para retirar.",
  },
  {
    image: "/retiro-paso-3.png",
    title: "Retirá en FADU",
    description: "Presentá el QR o tu número de pedido en el horario indicado y llevate tu compra.",
  },
] as const;

export function PickupStepsGuide() {
  return (
    <section className="mb-8" aria-labelledby="pickup-steps-title">
      <h2 id="pickup-steps-title" className="mb-5 text-lg font-semibold text-[#1d1d1b] md:text-xl">
        Paso a paso
      </h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.image}
            className="flex flex-col overflow-hidden rounded-xl border border-black/8 bg-white shadow-sm"
          >
            <div className="relative aspect-[5/4] bg-white">
              <Image
                src={step.image}
                alt=""
                fill
                className="object-contain p-3 md:p-4"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized
              />
            </div>
            <div className="flex flex-1 flex-col border-t border-black/6 p-4 md:p-5">
              <span className="mb-2 inline-flex w-fit rounded-full bg-[#0f3bff]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0f3bff]">
                Paso {index + 1}
              </span>
              <h3 className="text-base font-semibold text-[#1d1d1b]">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
