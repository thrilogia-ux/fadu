"use client";

import Image from "next/image";

type Props = {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
};

const SIZE_PX = {
  sm: 36,
  md: 56,
  lg: 80,
} as const;

export function BrandLoader({
  label = "Cargando…",
  size = "md",
  fullScreen = false,
  className = "",
}: Props) {
  const px = SIZE_PX[size];

  const content = (
    <div className={`flex flex-col items-center gap-3 ${className}`} role="status" aria-live="polite">
      <div
        className="relative animate-brand-loader"
        style={{ width: px, height: px }}
        aria-hidden
      >
        <Image
          src="/banquito.png"
          alt=""
          fill
          className="object-contain"
          sizes={`${px}px`}
          unoptimized
          priority
        />
      </div>
      {label ? <p className="text-sm font-medium text-gray-500">{label}</p> : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center py-12">{content}</div>
    );
  }

  return content;
}
