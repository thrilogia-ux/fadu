"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeroSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, slides.length]);

  if (slides.length === 0) {
    // Fallback si no hay slides
    return (
      <section className="relative h-[400px] bg-gradient-to-br from-[#0f3bff] to-[#0a2699] md:h-[500px]">
        <div className="mx-auto flex h-full max-w-7xl items-center px-4">
          <div className="max-w-2xl text-white">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Diseño y arquitectura para tu espacio
            </h1>
            <p className="mb-6 text-lg text-white/90">
              Descubrí productos exclusivos de iluminación, mobiliario y decoración.
            </p>
            <Link
              href="/ofertas"
              className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-[#0f3bff] hover:bg-white/90"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  return (
    <section
      className="relative h-[400px] overflow-hidden md:h-[500px]"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Imagen de fondo */}
      {slide.imageUrl ? (
        <Image
          src={slide.imageUrl}
          alt={slide.title || "Hero"}
          fill
          className="object-cover"
          priority
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f3bff] to-[#0a2699]" />
      )}

      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenido */}
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4">
        <div className="max-w-2xl text-white">
          {slide.title && (
            <h1 className="mb-4 text-4xl font-bold drop-shadow-lg md:text-5xl">
              {slide.title}
            </h1>
          )}
          {slide.subtitle && (
            <p className="mb-6 text-lg text-white/90 drop-shadow-md">
              {slide.subtitle}
            </p>
          )}
          {slide.buttonText && slide.buttonLink && (
            <Link
              href={slide.buttonLink}
              className="inline-block rounded-lg bg-white px-6 py-3 font-semibold text-[#0f3bff] transition hover:bg-white/90"
            >
              {slide.buttonText}
            </Link>
          )}
        </div>
      </div>

      {/* Controles de navegación */}
      {slides.length > 1 && (
        <>
          {/* Flechas */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Slide anterior"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Slide siguiente"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === current ? "w-8 bg-white" : "w-2 bg-white/50"
                }`}
                aria-label={`Ir al slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
