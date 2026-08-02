"use client";

import { useEffect, useRef, useState } from "react";

/** Pulso visual cuando aumenta la cantidad del carrito (no en la carga inicial). */
export function useCartBumpPulse(count: number, ready = true) {
  const [bump, setBump] = useState(false);
  const prevCount = useRef<number | null>(null);
  const synced = useRef(false);

  useEffect(() => {
    if (!ready) return;

    if (!synced.current) {
      synced.current = true;
      prevCount.current = count;
      return;
    }

    const prev = prevCount.current ?? 0;
    if (count > prev) {
      setBump(true);
      const timer = window.setTimeout(() => setBump(false), 520);
      prevCount.current = count;
      return () => window.clearTimeout(timer);
    }

    prevCount.current = count;
  }, [count, ready]);

  return bump;
}

type Props = {
  count: number;
  bump: boolean;
  className?: string;
};

export function CartBadge({ count, bump, className = "" }: Props) {
  const visible = count > 0;

  return (
    <span
      aria-hidden={!visible}
      className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0f3bff] px-1 text-xs font-semibold text-white ${visible ? "scale-100 opacity-100" : "pointer-events-none scale-0 opacity-0"} ${bump ? "animate-cart-bump" : ""} ${className}`}
    >
      {visible ? (count > 99 ? "99+" : count) : ""}
    </span>
  );
}
