"use client";

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

type LogoImgProps = {
  src: string;
  fallback: string;
  sizes: ReturnType<typeof logoResponsiveSizes>;
  variant: "header" | "footer";
  priority?: boolean;
};

function LogoImg({ src, fallback, sizes, variant, priority }: LogoImgProps) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt=".UBAfadu.shop"
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      onError={() => {
        setImgSrc((current) => (current !== fallback ? fallback : current));
      }}
      className={`store-logo-img ${variant === "footer" ? "opacity-90" : ""}`}
      style={
        {
          "--logo-h": `${sizes.mobile}px`,
          "--logo-h-md": `${sizes.md}px`,
          "--logo-h-lg": `${sizes.lg}px`,
          "--logo-max-w": `${sizes.maxMobile}px`,
          "--logo-max-w-md": `${sizes.maxMd}px`,
          "--logo-max-w-lg": `${sizes.maxLg}px`,
        } as React.CSSProperties
      }
    />
  );
}

type Props = {
  variant: "header" | "footer";
  priority?: boolean;
  link?: boolean;
  onClick?: () => void;
  className?: string;
};

export function StoreLogo({
  variant,
  priority = false,
  link = true,
  onClick,
  className = "",
}: Props) {
  const { settings } = useStoreLogo();
  const config = settings ?? DEFAULT_STORE_LOGO_SETTINGS;
  const resolvedSrc =
    variant === "header" ? resolveHeaderLogo(config) : resolveFooterLogo(config);
  const fallback = variant === "header" ? DEFAULT_HEADER_LOGO : DEFAULT_FOOTER_LOGO;
  const baseHeight = variant === "header" ? config.headerHeight : config.footerHeight;
  const sizes = logoResponsiveSizes(baseHeight, variant);

  const image = (
    <LogoImg
      src={resolvedSrc}
      fallback={fallback}
      sizes={sizes}
      variant={variant}
      priority={priority}
    />
  );

  if (!link) {
    return <span className={`inline-block ${className}`}>{image}</span>;
  }

  return (
    <Link href="/" className={`inline-block ${className}`} onClick={onClick}>
      {image}
    </Link>
  );
}

/** Vista previa reutilizable en admin (sin contexto). */
export function StoreLogoPreview({
  src,
  baseHeight,
  variant = "header",
}: {
  src: string;
  baseHeight: number;
  variant?: "header" | "footer";
}) {
  const sizes = logoResponsiveSizes(baseHeight, variant);
  const fallback = variant === "header" ? DEFAULT_HEADER_LOGO : DEFAULT_FOOTER_LOGO;

  return <LogoImg src={src} fallback={fallback} sizes={sizes} variant={variant} />;
}
