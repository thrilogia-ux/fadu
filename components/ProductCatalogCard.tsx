"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickView } from "@/components/ProductQuickView";
import type { HomeProductPlain } from "@/lib/home-data";

type Props = HomeProductPlain & {
  enableQuickView?: boolean;
};

export function ProductCatalogCard({
  enableQuickView = true,
  inStock = true,
  productType,
  ...card
}: Props) {
  const [quickSlug, setQuickSlug] = useState<string | null>(null);

  return (
    <>
      <div className="group/card relative h-full min-w-0">
        <ProductCard {...card} inStock={inStock} productType={productType} />
        {enableQuickView && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickSlug(card.slug);
            }}
            className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#1d1d1b] shadow-md transition hover:bg-white md:opacity-0 md:group-hover/card:opacity-100"
            aria-label={`Vista rápida de ${card.name}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}
      </div>
      {quickSlug && (
        <ProductQuickView
          slug={quickSlug}
          initial={{ ...card, inStock, productType: productType ?? "standard" }}
          onClose={() => setQuickSlug(null)}
        />
      )}
    </>
  );
}
