"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCatalogCard } from "@/components/ProductCatalogCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { mapProductToCatalog } from "@/lib/catalog-product-map";
import Link from "next/link";

interface Favorite {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    images: { url: string }[];
    category: { name: string; slug: string };
  };
}

export default function FavoritosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/cuenta/favoritos");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      Promise.all([
        fetch("/api/favorites").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
      ]).then(([favs, cats]) => {
        setFavorites(Array.isArray(favs) ? favs : []);
        setCategories(Array.isArray(cats) ? cats : []);
        setLoading(false);
      });
    }
  }, [session]);

  async function removeFavorite(productId: string) {
    try {
      await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setFavorites(favorites.filter((f) => f.product.id !== productId));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  }

  if (status === "loading" || loading) {
    return (
      <>
        <Header categories={[]} />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <ProductGridSkeleton count={4} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen overflow-x-hidden bg-gray-50 py-6 pb-12 md:py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 overflow-x-auto pb-1 text-sm text-gray-600">
            <Link href="/" className="shrink-0 hover:underline">Inicio</Link>
            <span>/</span>
            <Link href="/cuenta" className="hover:underline">Mi cuenta</Link>
            <span>/</span>
            <span className="text-[#1d1d1b]">Favoritos</span>
          </nav>

          <div className="mb-6 md:mb-8">
            <h1 className="text-center text-2xl font-bold text-[#1d1d1b] md:text-left md:text-3xl">
              Mis favoritos ({favorites.length})
            </h1>
          </div>

          {favorites.length === 0 ? (
            <EmptyState
              icon="❤️"
              title="No tenés favoritos todavía"
              description="Guardá los productos que te gusten para encontrarlos fácilmente cuando vuelvas a la tienda."
              primaryHref="/productos"
              primaryLabel="Explorar productos"
              secondaryHref="/cuenta"
              secondaryLabel="Mi cuenta"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {favorites.map((fav) => (
                <div key={fav.id} className="relative">
                  <ProductCatalogCard
                    {...mapProductToCatalog({
                      ...fav.product,
                      stock: 1,
                      inStock: true,
                    } as Parameters<typeof mapProductToCatalog>[0])}
                  />
                  <button
                    onClick={() => removeFavorite(fav.product.id)}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:bg-red-50"
                    title="Quitar de favoritos"
                  >
                    <span className="text-red-500">✕</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
