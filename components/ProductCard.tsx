import Link from "next/link";
import Image from "next/image";
import { productTypeLabel } from "@/lib/product-stock";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images: { url: string }[];
  category?: { name: string; slug: string };
  inStock?: boolean;
  productType?: string | null;
}

export function ProductCard({
  name,
  slug,
  price,
  compareAtPrice,
  images,
  category,
  inStock = true,
  productType,
}: ProductCardProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const typeLabel = productTypeLabel(productType);

  return (
    <Link
      href={`/producto/${slug}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-black/8 bg-white shadow-sm transition hover:border-black/12 hover:shadow-lg active:scale-[0.99]"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {images[0] ? (
          <Image
            src={images[0].url}
            alt={name}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            Sin imagen
          </div>
        )}
        {!inStock && (
          <span className="absolute right-2 top-2 rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs">
            Sin stock
          </span>
        )}
        {typeLabel && (
          <span className="absolute left-2 top-2 rounded-full bg-[#0f3bff] px-2 py-1 text-[10px] font-bold text-white sm:text-xs">
            {typeLabel}
          </span>
        )}
        {hasDiscount && inStock && (
          <span className={`absolute rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-white ${typeLabel ? "left-2 top-9" : "left-2 top-2"}`}>
            {discountPercent}% OFF
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="mb-0.5 min-h-[1rem] text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:min-h-[1.125rem] sm:text-xs">
          {category?.name ?? "\u00A0"}
        </p>
        <h3 className="mb-2 line-clamp-2 min-h-[2.75rem] flex-1 text-[15px] font-semibold leading-snug text-[#1d1d1b] sm:min-h-[3rem] sm:text-base">
          {name}
        </h3>
        <div className="mt-auto flex min-h-[4.25rem] flex-col items-start justify-end gap-0.5">
          <span
            className={`text-xs line-through ${hasDiscount ? "text-gray-400" : "invisible"}`}
            aria-hidden={!hasDiscount}
          >
            {hasDiscount
              ? `$${compareAtPrice!.toLocaleString("es-AR")}`
              : "\u00A0"}
          </span>
          <span className="text-lg font-bold tabular-nums text-[#1d1d1b] sm:text-xl">
            ${price.toLocaleString("es-AR")}
          </span>
          <span className="text-[11px] font-medium text-green-700 sm:text-xs">
            {inStock ? "Retiro en FADU" : "Lista de espera disponible"}
          </span>
        </div>
      </div>
    </Link>
  );
}
