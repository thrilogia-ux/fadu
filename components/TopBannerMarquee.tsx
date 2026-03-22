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

  // Un mensaje, sin datos aún, o usuario pide menos movimiento: texto centrado como antes
  if (list.length <= 1 || reduceMotion) {
    const line =
      reduceMotion && list.length > 1 ? list.join("  ·  ") : list[0];
    return (
      <p className="text-center text-sm font-medium text-white">{line}</p>
    );
  }

  const sep = "  ·  ";
  const combined = list.join(sep) + sep;

  return (
    <div
      className="relative w-full min-h-[1.25rem] overflow-hidden"
      aria-label="Avisos de la tienda"
    >
      <div className="top-banner-marquee-track flex w-max whitespace-nowrap text-sm font-medium text-white">
        <span className="inline-block shrink-0 px-10">{combined}</span>
        <span className="inline-block shrink-0 px-10">{combined}</span>
      </div>
    </div>
  );
}
