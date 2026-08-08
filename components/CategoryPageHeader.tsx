import Image from "next/image";
import { getCategoryIcon } from "@/lib/home-categories";

type Props = {
  name: string;
  slug: string;
};

export function CategoryPageHeader({ name, slug }: Props) {
  const icon = getCategoryIcon(slug);

  return (
    <header className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm md:rounded-3xl">
      <div className="flex flex-col items-center px-5 py-6 md:flex-row md:items-center md:justify-start md:gap-8 md:px-10 md:py-8 lg:gap-10 lg:px-12 lg:py-10">
        <div className="relative aspect-square w-full max-w-[220px] shrink-0 sm:max-w-[260px] md:max-w-[300px] md:w-[38%] lg:max-w-[340px]">
          <Image
            src={icon}
            alt=""
            fill
            className="object-contain"
            sizes="(max-width: 768px) 260px, 340px"
            priority
            unoptimized
          />
        </div>
        <h1 className="mt-4 w-full text-center text-[1.75rem] font-bold leading-tight text-[#1d1d1b] md:mt-0 md:flex-1 md:text-left md:text-4xl lg:text-[2.75rem]">
          {name}
        </h1>
      </div>
    </header>
  );
}
