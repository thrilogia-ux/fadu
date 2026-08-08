"use client";

import Image from "next/image";
import Link from "next/link";
import { useStoreLogo } from "@/lib/store-logo-context";
import {
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
  const src =
    variant === "header" ? resolveHeaderLogo(config) : resolveFooterLogo(config);
  const baseHeight = variant === "header" ? config.headerHeight : config.footerHeight;
  const sizes = logoResponsiveSizes(baseHeight, variant);

  const image = (
    <span
      className={`inline-block ${className}`}
      style={
        {
          "--logo-max-h": `${sizes.mobile}px`,
          "--logo-max-h-md": `${sizes.md}px`,
          "--logo-max-h-lg": `${sizes.lg}px`,
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
        className={`h-auto w-auto max-h-[var(--logo-max-h)] max-w-[var(--logo-max-w)] object-contain md:max-h-[var(--logo-max-h-md)] md:max-w-[var(--logo-max-w-md)] lg:max-h-[var(--logo-max-h-lg)] lg:max-w-[var(--logo-max-w-lg)] ${
          objectPosition === "left" ? "object-left" : ""
        } ${variant === "footer" ? "opacity-90" : ""}`}
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
