import {
  getAllActiveCategories,
  categoriesForHomeExplorationGrid,
  getFeaturedProductsForHome,
  getHeroSlidesForHome,
  getOffersProductsForHome,
} from "@/lib/home-data";
import { mergeHomeCategories } from "@/lib/home-fallback";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HomeHero } from "@/components/HomeHero";
import {
  HomeProductShelfClient,
  HomeShelfEmptyDestacados,
  HomeShelfEmptyOfertas,
} from "@/components/HomeProductShelfClient";
import Link from "next/link";
import Image from "next/image";

/** Misma referencia en cada render para no re-disparar el efecto del cliente. */
const HYDRATE_FEATURED_URLS = [
  "/api/products?limit=8&featured=true",
  "/api/products?limit=8&onSale=true",
  "/api/products?limit=8",
];

const HYDRATE_OFFERS_URLS = [
  "/api/products?limit=8&onSale=true",
  "/api/products?limit=8&featured=true",
  "/api/products?limit=8",
];

const ALLOWED_CATEGORY_SLUGS = [
  "iluminacion",
  "escritorio",
  "decoracion",
  "diseno",
  "accesorios",
];

async function HomePageContent() {
  const [heroSlides, featured, offers, categoriesRaw] = await Promise.all([
    getHeroSlidesForHome(),
    getFeaturedProductsForHome(),
    getOffersProductsForHome(),
    getAllActiveCategories(),
  ]);

  const allCategories = mergeHomeCategories(categoriesRaw);
  const homeGridCategories = categoriesForHomeExplorationGrid(allCategories, ALLOWED_CATEGORY_SLUGS);

  const iconsByCategory: Record<string, string> = {
    iluminacion: "/iluminacion.png",
    escritorio: "/escritorio.png",
    decoracion: "/decoracion.png",
    diseno: "/diseño.png",
    accesorios: "/accesorios.png",
  };

  return (
    <>
      <Header categories={allCategories} />

      <main className="min-w-0 overflow-x-hidden">
        <HomeHero slides={heroSlides} />

        <section className="bg-white py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between md:mb-8">
              <h2 className="text-xl font-bold text-[#1d1d1b] md:text-2xl">Destacados</h2>
              <Link href="/destacados" className="text-sm font-medium text-[#0f3bff] hover:underline">
                Ver todos
              </Link>
            </div>
            <HomeProductShelfClient
              initial={featured}
              hydrateUrls={HYDRATE_FEATURED_URLS}
              emptyFallback={<HomeShelfEmptyDestacados />}
            />
          </div>
        </section>

        <section className="border-t border-black/8 bg-gray-50 py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-6 text-xl font-bold text-[#1d1d1b] md:mb-8 md:text-2xl">Explorar por categoría</h2>
            <div className="grid grid-cols-3 gap-2 md:hidden">
              {homeGridCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="flex min-h-[44px] items-center justify-center rounded-lg bg-white px-3 py-2.5 text-center text-sm font-medium shadow-sm transition hover:shadow-md"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            <div className="hidden md:grid md:grid-cols-5 md:gap-4">
              {homeGridCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="flex flex-col items-center justify-center gap-3 rounded-lg border border-black/8 bg-white p-6 transition hover:shadow-lg"
                >
                  <div className="relative h-12 w-12">
                    <Image
                      src={iconsByCategory[cat.slug] || "/accesorios.png"}
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="text-center text-sm font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black/8 bg-white py-6 md:py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 md:h-12 md:w-12">
                  <Image src="/pickup.png" alt="" fill className="object-contain" unoptimized />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold">Retiro en FADU</h3>
                  <p className="text-xs text-gray-600 md:text-sm">Tu pedido listo en 7 días</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 md:h-12 md:w-12">
                  <Image src="/pay.png" alt="" fill className="object-contain" unoptimized />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold">Pagá como quieras</h3>
                  <p className="text-xs text-gray-600 md:text-sm">Mercado Pago o transferencia</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 md:h-12 md:w-12">
                  <Image src="/seguro.png" alt="" fill className="object-contain" unoptimized />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold">Compra segura</h3>
                  <p className="text-xs text-gray-600 md:text-sm">Tus datos están protegidos</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-black/8 bg-gray-50 py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between md:mb-8">
              <h2 className="text-xl font-bold text-[#1d1d1b] md:text-2xl">Ofertas imperdibles</h2>
              <Link href="/ofertas" className="text-sm font-medium text-[#0f3bff] hover:underline">
                Ver todas
              </Link>
            </div>
            <HomeProductShelfClient
              initial={offers}
              hydrateUrls={HYDRATE_OFFERS_URLS}
              emptyFallback={<HomeShelfEmptyOfertas />}
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default async function Home() {
  try {
    return await HomePageContent();
  } catch (e) {
    console.error("[Home] error crítico, modo degradado:", e);
    return (
      <>
        <Header categories={mergeHomeCategories([])} />
        <main className="min-w-0 px-4 py-12">
          <div className="mx-auto max-w-lg rounded-lg border border-black/10 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-[#1d1d1b]">No pudimos cargar el inicio</h1>
            <p className="mt-2 text-sm text-gray-600">Probá actualizar la página o entrá más tarde.</p>
            <Link
              href="/productos"
              className="mt-6 inline-block rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-medium text-white"
            >
              Ver productos
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }
}
