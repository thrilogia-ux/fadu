"use client";

import { useEffect, useState } from "react";

const FALLBACK = "Retirás tu compra en el Pickup Point en FADU";

type Msg = { id: string; text: string };

export function TopBannerMarquee() {
  const [messages, setMessages] = useState<Msg[] | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const fn = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/top-banner-messages");
        const data = await res.json();
        if (!cancelled && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const list: string[] =
    messages === null || messages.length === 0
      ? [FALLBACK]
      : messages.map((m) => m.text);

  const sep = " - ";

  // Sin animación: todo en una línea con guiones
  if (reduceMotion) {
    const line = list.join(sep);
    return (
      <p className="text-center text-sm font-medium text-white">{line}</p>
    );
  }

  // Marquesina derecha → izquierda: repetimos el bloque si hay un solo mensaje
  // para que el carril siempre se mueva (texto entra por la derecha y sale por la izquierda)
  const rail =
    list.length >= 2 ? list : [list[0], list[0], list[0]];
  const combined = rail.join(sep) + sep;

  return (
    <div
      className="relative w-full min-h-[1.25rem] overflow-hidden"
      aria-label="Avisos de la tienda"
    >
      <div className="top-banner-marquee-track flex w-max whitespace-nowrap text-sm font-medium text-white will-change-transform">
        <span className="inline-block shrink-0 px-12">{combined}</span>
        <span className="inline-block shrink-0 px-12">{combined}</span>
      </div>
    </div>
  );
}
