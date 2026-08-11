import Image from "next/image";
import { BRAND_ICONS, type BrandIconName } from "@/lib/brand-icons";

type Props = {
  name: BrandIconName;
  size?: number;
  className?: string;
};

export function BrandIcon({ name, size = 24, className = "" }: Props) {
  return (
    <Image
      src={BRAND_ICONS[name]}
      alt=""
      width={size}
      height={size}
      className={`object-contain ${className}`.trim()}
      aria-hidden
      unoptimized
    />
  );
}
