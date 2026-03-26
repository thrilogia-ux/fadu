import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images: { url: string }[];
  category?: { name: string; slug: string };
}

export function ProductCard({ name, slug, price, compareAtPrice, images, category }: ProductCardProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <Link
      href={`/producto/${slug}`}
      className="group block min-w-0 overflow-hidden rounded-lg border border-black/8 bg-white shadow-sm transition hover:shadow-lg hover:border-black/12 active:scale-[0.99]"
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
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-white">
            {discountPercent}% OFF
          </span>
        )}
      </div>
      <div className="flex min-h-[5.5rem] flex-col p-3 sm:p-4">
        {category && (
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
            {category.name}
          </p>
        )}
        <h3 className="mb-2 line-clamp-2 flex-1 text-[15px] font-semibold leading-snug text-[#1d1d1b] sm:text-base">
          {name}
        </h3>
        <div className="mt-auto flex flex-col items-start gap-0.5">
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ${compareAtPrice.toLocaleString("es-AR")}
            </span>
          )}
          <span className="text-lg font-bold tabular-nums text-[#1d1d1b] sm:text-xl">
            ${price.toLocaleString("es-AR")}
          </span>
          <span className="text-[11px] font-medium text-green-700 sm:text-xs">Retiro en FADU</span>
        </div>
      </div>
    </Link>
  );
}
