import Image from "next/image";
import { getCategoryIcon } from "@/lib/home-categories";

type Props = {
  name: string;
  slug: string;
  productCount: number;
};

export function CategoryPageHeader({ name, slug, productCount }: Props) {
  const icon = getCategoryIcon(slug);

  return (
    <header className="mb-6 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
      <div className="relative flex flex-col items-center gap-5 px-6 py-8 sm:flex-row sm:items-center sm:gap-8 sm:px-8 sm:py-9 md:gap-10 md:py-10">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#0f3bff]/10 via-[#0f3bff]/4 to-transparent sm:w-[42%]"
          aria-hidden
        />
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-black/6 sm:h-32 sm:w-32 md:h-36 md:w-36">
          <div className="relative h-[80%] w-[80%]">
            <Image src={icon} alt="" fill className="object-contain" sizes="144px" unoptimized />
          </div>
        </div>
        <div className="relative min-w-0 text-center sm:text-left">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#0f3bff]">
            Categoría
          </p>
          <h1 className="text-2xl font-bold text-[#1d1d1b] md:text-3xl">{name}</h1>
          <p className="mt-2 inline-flex rounded-full bg-[#0f3bff]/8 px-3 py-1 text-sm font-medium text-[#1d1d1b]">
            {productCount} {productCount === 1 ? "producto disponible" : "productos disponibles"}
          </p>
        </div>
      </div>
    </header>
  );
}
