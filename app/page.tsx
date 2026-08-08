import {
  getAllActiveCategories,
  categoriesForHomeExplorationGrid,
  getFeaturedProductsForHome,
  getHeroSlidesForHome,
  getOffersProductsForHome,
} from "@/lib/home-data";
import { mergeHomeCategories } from "@/lib/home-fallback";
import { HOME_CATEGORY_ICONS, HOME_EXPLORE_SLUGS } from "@/lib/home-categories";

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
import { PickupPromoBanner } from "@/components/PickupPromoBanner";
import { getPickupInfo } from "@/lib/pickup";
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

const ALLOWED_CATEGORY_SLUGS = [...HOME_EXPLORE_SLUGS];

async function HomePageContent() {
  const [heroSlides, featured, offers, categoriesRaw, pickup] = await Promise.all([
    getHeroSlidesForHome(),
    getFeaturedProductsForHome(),
    getOffersProductsForHome(),
    getAllActiveCategories(),
    getPickupInfo(),
  ]);

  const allCategories = mergeHomeCategories(categoriesRaw);
  const homeGridCategories = categoriesForHomeExplorationGrid(allCategories, ALLOWED_CATEGORY_SLUGS);

  return (
    <>
      <Header categories={allCategories} />

      <main className="min-w-0">
        <HomeHero slides={heroSlides} />

        <div className="overflow-x-hidden">
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
            <div className="grid grid-cols-3 gap-3 md:gap-5">
              {homeGridCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-black/8 bg-white p-3 transition hover:border-[#0f3bff]/25 hover:shadow-md md:gap-3 md:p-5"
                >
                  <div className="relative aspect-square w-full max-w-[120px] md:max-w-[160px]">
                    <Image
                      src={HOME_CATEGORY_ICONS[cat.slug] ?? "/categorias/accesorios.png"}
                      alt=""
                      fill
                      className="object-contain transition group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 33vw, 160px"
                      unoptimized
                    />
                  </div>
                  <span className="text-center text-xs font-medium text-[#1d1d1b] md:text-sm">
                    {cat.name}
                  </span>
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
                  <Image src="/retiro-en-fadu.png" alt="" fill className="object-contain" unoptimized />
                </div>
                <div className="min-w-0">
                  <Link href="/retiro" className="font-semibold hover:text-[#0f3bff]">
                    Retiro en FADU
                  </Link>
                  <p className="text-xs text-gray-600 md:text-sm">Tu pedido listo en 7 días</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 md:h-12 md:w-12">
                  <Image src="/paga-como-quieras.png" alt="" fill className="object-contain" unoptimized />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold">Pagá como quieras</h3>
                  <p className="text-xs text-gray-600 md:text-sm">Mercado Pago o transferencia</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 md:h-12 md:w-12">
                  <Image src="/compra-segura.png" alt="" fill className="object-contain" unoptimized />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold">Compra segura</h3>
                  <p className="text-xs text-gray-600 md:text-sm">Tus datos están protegidos</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-black/8 bg-[#fafafa] py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <PickupPromoBanner pickup={pickup} />
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
        </div>
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
