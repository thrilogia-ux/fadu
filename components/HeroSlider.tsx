"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeroSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  imagePosition?: string | null;
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(true);
  
  // Touch/swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const nextSlide = useCallback(() => {
    if (!isTransitioning) setIsTransitioning(true);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length, isTransitioning]);

  const prevSlide = useCallback(() => {
    if (!isTransitioning) setIsTransitioning(true);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length, isTransitioning]);

  const goToSlide = useCallback((index: number) => {
    if (!isTransitioning) setIsTransitioning(true);
    setCurrent(index);
  }, [isTransitioning]);

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsAutoPlaying(true);
      return;
    }
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
    setIsAutoPlaying(true);
  };

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
              className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-[#0f3bff] hover:bg-white/90"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative h-[280px] sm:h-[340px] md:h-[420px] lg:h-[500px] touch-pan-y"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Contenedor con overflow oculto */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Contenedor de slides con transición suave */}
        <div
          className={`flex h-full w-full ${isTransitioning ? "transition-transform duration-700 ease-in-out" : ""}`}
          style={{ 
            transform: `translateX(-${current * 100}%)`,
            willChange: "transform"
          }}
        >
          {slides.map((slide, index) => (
            <div 
              key={slide.id} 
              className="relative h-full flex-shrink-0"
              style={{ width: "100%", minWidth: "100%" }}
            >
            {/* Imagen de fondo */}
            {slide.imageUrl ? (
              <Image
                src={slide.imageUrl}
                alt={slide.title || "Hero"}
                fill
                className="object-cover"
                style={{ objectPosition: slide.imagePosition || "50% 50%" }}
                priority={index === 0}
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
                  <h1 className="mb-2 text-2xl font-bold drop-shadow-lg sm:mb-3 sm:text-3xl md:mb-4 md:text-4xl lg:text-5xl">
                    {slide.title}
                  </h1>
                )}
                {slide.subtitle && (
                  <p className="mb-4 text-sm text-white/90 drop-shadow-md sm:mb-5 sm:text-base md:mb-6 md:text-lg">
                    {slide.subtitle}
                  </p>
                )}
                {slide.buttonText && slide.buttonLink && (
                  <Link
                    href={slide.buttonLink}
                    className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-[#0f3bff] transition hover:bg-white/90"
                  >
                    {slide.buttonText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Controles de navegación */}
      {slides.length > 1 && (
        <>
          {/* Flechas - ocultas en mobile, visibles en tablet/desktop */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/30 hidden md:flex items-center justify-center"
            aria-label="Slide anterior"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition hover:bg-white/30 hidden md:flex items-center justify-center"
            aria-label="Slide siguiente"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-6">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
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
