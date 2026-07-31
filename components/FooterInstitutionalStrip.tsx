const INSTITUTIONAL_LOGOS = [
  { src: "/franja-logos/1.png", alt: "Universidad de Buenos Aires" },
  { src: "/franja-logos/2.png", alt: "Facultad de Arquitectura, Diseño y Urbanismo" },
  { src: "/franja-logos/3.png", alt: "UBA Diseño" },
  { src: "/franja-logos/4.png", alt: "UBA SRICC" },
  { src: "/franja-logos/5.png", alt: "Diseño de Imagen y Sonido" },
] as const;

export function FooterInstitutionalStrip() {
  return (
    <div className="w-full bg-[#0f3bff]">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-col items-center justify-center gap-3 px-4 py-3 md:flex-row md:gap-6 md:px-6 md:py-0">
        {/* Mobile: 3 arriba + 2 abajo */}
        <div className="grid w-full grid-cols-3 items-center justify-items-center gap-x-3 gap-y-3 md:hidden">
          {INSTITUTIONAL_LOGOS.slice(0, 3).map((logo) => (
            <img
              key={logo.src}
              src={logo.src}
              alt={logo.alt}
              className="h-auto max-h-[44px] w-full max-w-[110px] object-contain"
              loading="lazy"
              decoding="async"
            />
          ))}
          <div className="col-span-3 flex w-full items-center justify-center gap-6">
            {INSTITUTIONAL_LOGOS.slice(3).map((logo) => (
              <img
                key={logo.src}
                src={logo.src}
                alt={logo.alt}
                className="h-auto max-h-[44px] w-full max-w-[140px] object-contain"
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>

        {/* Desktop: una fila */}
        <div className="hidden w-full items-center justify-between gap-4 md:flex">
          {INSTITUTIONAL_LOGOS.map((logo) => (
            <img
              key={logo.src}
              src={logo.src}
              alt={logo.alt}
              className="h-auto max-h-[52px] w-auto max-w-[18%] flex-1 object-contain object-center"
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
