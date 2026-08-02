import Link from "next/link";

type Step = 1 | 2 | 3;

const STEPS = [
  { n: 1 as const, label: "Carrito", href: "/carrito" },
  { n: 2 as const, label: "Pago", href: "/checkout" },
  { n: 3 as const, label: "Confirmación", href: null },
];

type Props = {
  current: Step;
};

export function CheckoutSteps({ current }: Props) {
  return (
    <nav aria-label="Progreso de compra" className="mb-6 md:mb-8">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((step, idx) => {
          const done = step.n < current;
          const active = step.n === current;
          const upcoming = step.n > current;

          const circleClass = done
            ? "border-[#0f3bff] bg-[#0f3bff] text-white"
            : active
              ? "border-[#0f3bff] bg-white text-[#0f3bff]"
              : "border-gray-300 bg-white text-gray-400";

          const labelClass = active
            ? "font-semibold text-[#0f3bff]"
            : done
              ? "font-medium text-[#1d1d1b]"
              : "text-gray-400";

          const content = (
            <>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${circleClass}`}
              >
                {done ? "✓" : step.n}
              </span>
              <span className={`hidden text-sm sm:inline ${labelClass}`}>{step.label}</span>
            </>
          );

          return (
            <li key={step.n} className="flex items-center gap-2 sm:gap-4">
              {step.href && !upcoming ? (
                <Link
                  href={step.href}
                  className="flex items-center gap-2 transition hover:opacity-80"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-center gap-2">{content}</div>
              )}
              {idx < STEPS.length - 1 ? (
                <span
                  className={`h-0.5 w-6 sm:w-12 ${done ? "bg-[#0f3bff]" : "bg-gray-200"}`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-xs text-gray-500 sm:hidden">
        Paso {current} de 3 · {STEPS[current - 1].label}
      </p>
    </nav>
  );
}
