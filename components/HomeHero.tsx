"use client";

import nextDynamic from "next/dynamic";

const HeroSlider = nextDynamic(() => import("@/components/HeroSliderClient"), {
  ssr: false,
  loading: () => (
    <section
      className="relative h-[280px] bg-gradient-to-br from-[#0f3bff] to-[#0a2699] sm:h-[340px] md:h-[420px] lg:h-[500px]"
      aria-hidden
    />
  ),
});

export type HomeHeroSlide = {
  id: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  imagePosition?: string | null;
};

export function HomeHero({ slides }: { slides: HomeHeroSlide[] }) {
  return <HeroSlider slides={slides} />;
}
