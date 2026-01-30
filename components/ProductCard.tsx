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
      className="group block min-w-0 overflow-hidden rounded-lg border border-black/8 bg-white transition hover:shadow-lg"
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
      <div className="p-4">
        {category && (
          <p className="mb-1 text-xs text-gray-500">{category.name}</p>
        )}
        <h3 className="mb-2 line-clamp-2 text-sm font-medium text-[#1d1d1b]">
          {name}
        </h3>
        <div className="flex items-baseline gap-2">
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ${compareAtPrice.toLocaleString("es-AR")}
            </span>
          )}
          <span className="text-xl font-semibold text-[#1d1d1b]">
            ${price.toLocaleString("es-AR")}
          </span>
        </div>
        <p className="mt-1 text-xs text-green-600">Retiro en FADU</p>
      </div>
    </Link>
  );
}
