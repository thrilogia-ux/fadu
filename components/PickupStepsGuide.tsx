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
      <h2 id="pickup-steps-title" className="mb-6 text-lg font-semibold text-[#1d1d1b] md:text-xl">
        Paso a paso
      </h2>
      <ol className="flex flex-col gap-6 md:gap-8">
        {STEPS.map((step, index) => {
          const reverse = index % 2 === 1;

          return (
            <li key={step.image} className="relative">
              {index < STEPS.length - 1 && (
                <div
                  className="absolute left-1/2 top-full z-10 hidden h-6 w-px -translate-x-1/2 bg-[#0f3bff]/25 md:block md:h-8"
                  aria-hidden
                />
              )}
              <div
                className={`flex flex-col overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm md:flex-row md:items-stretch ${
                  reverse ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="relative aspect-square w-full shrink-0 bg-white md:w-[58%] lg:w-[60%]">
                  <Image
                    src={step.image}
                    alt=""
                    fill
                    className="object-contain p-1 sm:p-2"
                    sizes="(max-width: 768px) 100vw, 60vw"
                    unoptimized
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center border-t border-black/6 p-5 md:border-t-0 md:p-8 lg:p-10">
                  <span className="mb-3 inline-flex w-fit rounded-full bg-[#0f3bff] px-3 py-1 text-sm font-bold text-white">
                    Paso {index + 1}
                  </span>
                  <h3 className="text-xl font-bold text-[#1d1d1b] md:text-2xl">{step.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-gray-600">{step.description}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
