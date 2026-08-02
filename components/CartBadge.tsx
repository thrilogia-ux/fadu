"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  count: number;
  className?: string;
};

export function CartBadge({ count, className = "" }: Props) {
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const timer = window.setTimeout(() => setBump(false), 450);
      prevCount.current = count;
      return () => window.clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count]);

  if (count <= 0) return null;

  return (
    <span
      className={`absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0f3bff] text-xs font-semibold text-white transition-transform ${bump ? "animate-cart-bump" : ""} ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
