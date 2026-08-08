"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStoreLogo } from "@/lib/store-logo-context";
import {
  DEFAULT_FOOTER_LOGO,
  DEFAULT_HEADER_LOGO,
  DEFAULT_STORE_LOGO_SETTINGS,
  logoResponsiveSizes,
  resolveFooterLogo,
  resolveHeaderLogo,
} from "@/lib/store-logo";

type Props = {
  variant: "header" | "footer";
  priority?: boolean;
  link?: boolean;
  onClick?: () => void;
  className?: string;
  objectPosition?: "left" | "center";
};

export function StoreLogo({
  variant,
  priority = false,
  link = true,
  onClick,
  className = "",
  objectPosition = "center",
}: Props) {
  const { settings } = useStoreLogo();
  const config = settings ?? DEFAULT_STORE_LOGO_SETTINGS;
  const resolvedSrc =
    variant === "header" ? resolveHeaderLogo(config) : resolveFooterLogo(config);
  const fallback = variant === "header" ? DEFAULT_HEADER_LOGO : DEFAULT_FOOTER_LOGO;
  const [src, setSrc] = useState(resolvedSrc);

  useEffect(() => {
    setSrc(resolvedSrc);
  }, [resolvedSrc]);

  const baseHeight = variant === "header" ? config.headerHeight : config.footerHeight;
  const sizes = logoResponsiveSizes(baseHeight, variant);

  const image = (
    <span
      className={`store-logo-slot inline-flex items-center ${objectPosition === "left" ? "justify-start" : "justify-center"} ${className}`}
      style={
        {
          "--logo-h": `${sizes.mobile}px`,
          "--logo-h-md": `${sizes.md}px`,
          "--logo-h-lg": `${sizes.lg}px`,
          "--logo-max-w": `min(72vw, ${sizes.maxMobile}px)`,
          "--logo-max-w-md": `${sizes.maxMd}px`,
          "--logo-max-w-lg": `${sizes.maxLg}px`,
        } as React.CSSProperties
      }
    >
      <Image
        src={src}
        alt=".UBAfadu.shop"
        width={300}
        height={92}
        priority={priority}
        unoptimized
        onError={() => {
          if (src !== fallback) setSrc(fallback);
        }}
        className={`store-logo-img ${variant === "footer" ? "opacity-90" : ""}`}
      />
    </span>
  );

  if (!link) return image;

  return (
    <Link href="/" className="inline-block" onClick={onClick}>
      {image}
    </Link>
  );
}

/** Vista previa reutilizable en admin (sin contexto). */
export function StoreLogoPreview({
  src,
  baseHeight,
  variant = "header",
  className = "",
}: {
  src: string;
  baseHeight: number;
  variant?: "header" | "footer";
  className?: string;
}) {
  const sizes = logoResponsiveSizes(baseHeight, variant);
  const fallback = variant === "header" ? DEFAULT_HEADER_LOGO : DEFAULT_FOOTER_LOGO;
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <span
      className={`store-logo-slot inline-flex items-center justify-center ${className}`}
      style={
        {
          "--logo-h": `${sizes.mobile}px`,
          "--logo-h-md": `${sizes.md}px`,
          "--logo-h-lg": `${sizes.lg}px`,
          "--logo-max-w": `min(72vw, ${sizes.maxMobile}px)`,
          "--logo-max-w-md": `${sizes.maxMd}px`,
          "--logo-max-w-lg": `${sizes.maxLg}px`,
        } as React.CSSProperties
      }
    >
      <Image
        src={imgSrc}
        alt="Vista previa del logo"
        width={300}
        height={92}
        unoptimized
        onError={() => {
          if (imgSrc !== fallback) setImgSrc(fallback);
        }}
        className={`store-logo-img ${variant === "footer" ? "opacity-90" : ""}`}
      />
    </span>
  );
}
