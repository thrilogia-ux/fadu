"use client";

import { HeroSlider } from "@/components/HeroSlider";

export type HomeHeroSlide = {
  id: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  imagePosition?: string | null;
};

/** Slider con SSR: el HTML inicial coincide con el cliente (sin agujero azul hasta que cargue JS). */
export function HomeHero({ slides }: { slides: HomeHeroSlide[] }) {
  return <HeroSlider slides={slides} />;
}
