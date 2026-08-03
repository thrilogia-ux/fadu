"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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

type ExtendedSlide = HeroSlide & {
  key: string;
  realIndex: number;
};

const GAP_PX = 16;
const AUTOPLAY_MS = 6000;

function FallbackHero() {
  return (
    <section className="bg-[#fafafa] py-6 md:py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative flex h-[min(72vw,520px)] min-h-[280px] flex-col justify-end overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0f3bff] to-[#0a2699] p-8 md:p-12">
          <div className="relative z-10 max-w-xl text-white">
            <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-5xl">
              Diseño y arquitectura para tu espacio
            </h1>
            <p className="mb-6 text-base text-white/90 md:text-lg">
              Descubrí productos exclusivos de iluminación, mobiliario y decoración.
            </p>
            <Link
              href="/ofertas"
              className="inline-flex items-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#0f3bff] transition hover:bg-white/95"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildExtendedSlides(slides: HeroSlide[]): ExtendedSlide[] {
  if (slides.length <= 1) {
    return slides.map((slide, i) => ({
      ...slide,
      key: slide.id,
      realIndex: i,
    }));
  }

  const last = slides.length - 1;
  return [
    { ...slides[last], key: `${slides[last].id}-clone-before`, realIndex: last },
    ...slides.map((slide, i) => ({ ...slide, key: slide.id, realIndex: i })),
    { ...slides[0], key: `${slides[0].id}-clone-after`, realIndex: 0 },
  ];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const canLoop = slides.length > 1;
  const extendedSlides = useMemo(() => buildExtendedSlides(slides), [slides]);

  const [position, setPosition] = useState(canLoop ? 1 : 0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const dragStartX = useRef<number | null>(null);

  const slideWidth = containerWidth > 0 ? containerWidth : 0;
  const step = slideWidth + GAP_PX;

  const current = canLoop
    ? extendedSlides[position]?.realIndex ?? 0
    : position;

  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [updateWidth]);

  const goTo = useCallback(
    (realIndex: number) => {
      if (slides.length === 0) return;
      if (canLoop) {
        setTransitionEnabled(true);
        setPosition(realIndex + 1);
      } else {
        setPosition(realIndex);
      }
    },
    [canLoop, slides.length]
  );

  const nextSlide = useCallback(() => {
    if (!canLoop) {
      setPosition((p) => Math.min(p + 1, slides.length - 1));
      return;
    }
    setTransitionEnabled(true);
    setPosition((p) => p + 1);
  }, [canLoop, slides.length]);

  const prevSlide = useCallback(() => {
    if (!canLoop) {
      setPosition((p) => Math.max(p - 1, 0));
      return;
    }
    setTransitionEnabled(true);
    setPosition((p) => p - 1);
  }, [canLoop]);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const interval = setInterval(nextSlide, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, slides.length]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) setIsAutoPlaying(false);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /** Salto instantáneo al slide real cuando llegamos a un clon. */
  const handleTransitionEnd = useCallback(() => {
    if (!canLoop || isDragging) return;
    const lastClonePos = slides.length + 1;

    if (position === lastClonePos) {
      setTransitionEnabled(false);
      setPosition(1);
    } else if (position === 0) {
      setTransitionEnabled(false);
      setPosition(slides.length);
    }
  }, [canLoop, isDragging, position, slides.length]);

  useEffect(() => {
    if (transitionEnabled) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransitionEnabled(true));
    });
    return () => cancelAnimationFrame(id);
  }, [transitionEnabled, position]);

  const baseOffset = slideWidth > 0 ? -position * step : 0;
  const translateX = baseOffset + (isDragging ? dragOffset : 0);

  const animateTrack = transitionEnabled && !isDragging;

  function commitDrag(delta: number) {
    const threshold = slideWidth * 0.18;
    if (delta > threshold) prevSlide();
    else if (delta < -threshold) nextSlide();
    setDragOffset(0);
    setIsDragging(false);
  }

  function onPointerDown(clientX: number) {
    dragStartX.current = clientX;
    setIsDragging(true);
    setIsAutoPlaying(false);
  }

  function onPointerMove(clientX: number) {
    if (dragStartX.current == null) return;
    setDragOffset(clientX - dragStartX.current);
  }

  function onPointerUp() {
    if (dragStartX.current == null) return;
    commitDrag(dragOffset);
    dragStartX.current = null;
    setIsAutoPlaying(true);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    onPointerDown(e.targetTouches[0].clientX);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.targetTouches[0].clientX - touchStartX.current;
    const dy = e.targetTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      onPointerMove(e.targetTouches[0].clientX);
    }
  }

  function handleTouchEnd() {
    touchStartX.current = null;
    touchStartY.current = null;
    onPointerUp();
  }

  if (slides.length === 0) {
    return <FallbackHero />;
  }

  return (
    <section
      className="relative bg-[#fafafa] py-6 md:py-10"
      aria-roledescription="carousel"
      aria-label="Destacados de la tienda"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden md:overflow-visible"
        >
          <div
            ref={trackRef}
            className={`flex cursor-grab active:cursor-grabbing ${animateTrack ? "transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]" : ""}`}
            style={{
              gap: GAP_PX,
              transform: `translate3d(${translateX}px, 0, 0)`,
              willChange: "transform",
            }}
            onTransitionEnd={(e) => {
              if (e.target !== e.currentTarget) return;
              handleTransitionEnd();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              onPointerDown(e.clientX);
            }}
            onMouseMove={(e) => {
              if (isDragging) onPointerMove(e.clientX);
            }}
            onMouseUp={onPointerUp}
            onMouseLeave={() => {
              if (isDragging) onPointerUp();
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {extendedSlides.map((slide, index) => {
              const isActive = index === position;
              const distance = Math.abs(index - position);
              const scale =
                isMobile ? 1 : isActive ? 1 : distance === 1 ? 0.98 : 0.95;
              const opacity =
                isMobile ? 1 : isActive ? 1 : distance === 1 ? 0.92 : 0.8;

              return (
                <article
                  key={slide.key}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${slide.realIndex + 1} de ${slides.length}`}
                  className={`relative h-[min(70vw,480px)] min-h-[260px] shrink-0 overflow-hidden rounded-[28px] bg-[#f5f5f7] transition-[transform,opacity,filter] duration-500 ease-out sm:min-h-[300px] md:h-[min(48vw,520px)] md:min-h-[360px] ${!isActive && !isMobile ? "grayscale" : ""}`}
                  style={{
                    width: slideWidth || "100%",
                    transform: `scale(${scale})`,
                    opacity,
                  }}
                  aria-hidden={!isActive}
                  onClick={() => {
                    if (!isActive && Math.abs(dragOffset) < 8) goTo(slide.realIndex);
                  }}
                >
                  {slide.imageUrl ? (
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title || "Promoción"}
                      fill
                      className="object-cover"
                      style={{ objectPosition: slide.imagePosition || "50% 50%" }}
                      priority={slide.realIndex === 0 && !slide.key.includes("clone")}
                      unoptimized
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f3bff] to-[#0a2699]" />
                  )}

                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
                    aria-hidden
                  />

                  <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 md:p-10">
                    <div className="max-w-lg text-white">
                      {slide.title && (
                        <h2 className="mb-2 text-2xl font-bold tracking-tight drop-shadow-sm sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-tight">
                          {slide.title}
                        </h2>
                      )}
                      {slide.subtitle && (
                        <p className="mb-5 text-sm leading-relaxed text-white/90 sm:text-base md:text-lg">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.buttonText && slide.buttonLink && (
                        <Link
                          href={slide.buttonLink}
                          className="inline-flex items-center rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-[#1d1d1b] shadow-sm transition hover:bg-white"
                          onClick={(e) => isDragging && Math.abs(dragOffset) > 8 && e.preventDefault()}
                        >
                          {slide.buttonText}
                          <span className="ml-1.5 text-[#0f3bff]" aria-hidden>
                            →
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="mx-auto mt-5 flex justify-center px-4 md:mt-7">
          <div className="inline-flex items-center gap-3 rounded-full bg-[#e8e8ed]/90 px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === current}
                  aria-label={`Slide ${idx + 1}`}
                  onClick={() => {
                    goTo(idx);
                    setIsAutoPlaying(false);
                    setTimeout(() => setIsAutoPlaying(true), AUTOPLAY_MS);
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    idx === current
                      ? "h-2 w-6 bg-[#1d1d1b]"
                      : "h-2 w-2 bg-[#86868b] hover:bg-[#6e6e73]"
                  }`}
                />
              ))}
            </div>

            <span className="h-4 w-px bg-[#c7c7cc]" aria-hidden />

            <button
              type="button"
              onClick={() => setIsAutoPlaying((p) => !p)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#1d1d1b] transition hover:bg-black/5"
              aria-label={isAutoPlaying ? "Pausar carrusel" : "Reproducir carrusel"}
            >
              {isAutoPlaying ? (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5.14v14.72a1 1 0 001.5.86l11.04-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
