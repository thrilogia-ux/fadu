"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import type { HomeProductPlain } from "@/lib/home-data";
import { normalizeApiProductList } from "@/lib/normalize-api-product";

type Props = {
  initial: HomeProductPlain[];
  /** Intentos en orden (paths relativos: siempre mismo origen que la página). */
  hydrateUrls: string[];
  emptyFallback: ReactNode;
};

/**
 * Si el RSC llegó sin productos, reintenta desde el navegador con /api/...
 * (misma pestaña = misma URL; no hace falta NEXT_PUBLIC_SITE_URL).
 */
export function HomeProductShelfClient({ initial, hydrateUrls, emptyFallback }: Props) {
  const initialKey = useMemo(() => initial.map((p) => p.id).join(","), [initial]);
  const [items, setItems] = useState<HomeProductPlain[]>(initial);
  const [loading, setLoading] = useState(initial.length === 0);

  useEffect(() => {
    setItems(initial);
    if (initial.length > 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      for (const path of hydrateUrls) {
        if (cancelled) break;
        try {
          const r = await fetch(path, { cache: "no-store" });
          const data = await r.json();
          const list = normalizeApiProductList(data, 8);
          if (list.length > 0) {
            if (!cancelled) setItems(list);
            break;
          }
        } catch {
          /* siguiente URL */
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialKey, hydrateUrls]);

  if (loading && items.length === 0) {
    return (
      <div className="rounded-lg border border-black/10 bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
        Cargando productos…
      </div>
    );
  }

  if (items.length === 0) {
    return <>{emptyFallback}</>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {items.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          slug={product.slug}
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          images={product.images}
          category={product.category}
        />
      ))}
    </div>
  );
}

/** Wrapper para el texto + link sin romper el JSX del padre */
export function HomeShelfEmptyDestacados() {
  return (
    <div className="rounded-lg border border-black/10 bg-gray-50 px-4 py-8 text-center">
      <p className="text-sm text-gray-600">
        No pudimos cargar los destacados ahora.{" "}
        <Link href="/productos" className="font-medium text-[#0f3bff] hover:underline">
          Ver todos los productos
        </Link>
      </p>
    </div>
  );
}

export function HomeShelfEmptyOfertas() {
  return (
    <div className="rounded-lg border border-black/10 bg-white px-4 py-8 text-center shadow-sm">
      <p className="text-sm text-gray-600">
        Ofertas no disponibles en este momento.{" "}
        <Link href="/ofertas" className="font-medium text-[#0f3bff] hover:underline">
          Ir a ofertas
        </Link>
      </p>
    </div>
  );
}
