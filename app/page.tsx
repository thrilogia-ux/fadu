import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { HeroSlider } from "@/components/HeroSlider";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  // Hero slides activos
  const heroSlides = await prisma.heroSlide.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      buttonText: true,
      buttonLink: true,
      imageUrl: true,
      imagePosition: true,
    },
  });

  // Categorías activas (solo las 5 del home)
  const allowedCategorySlugs = ["iluminacion", "escritorio", "decoracion", "diseno", "accesorios"];
  const allCategories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  });
  const categories = allCategories.filter((c) => allowedCategorySlugs.includes(c.slug));

  // Productos destacados
  const featured = await prisma.product.findMany({
    where: { active: true, featured: true },
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  // Productos en oferta (con compareAtPrice)
  const offers = await prisma.product.findMany({
    where: {
      active: true,
      compareAtPrice: { not: null },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  const iconsByCategory: Record<string, string> = {
    iluminacion: "/iluminacion.png",
    escritorio: "/escritorio.png",
    decoracion: "/decoracion.png",
    diseno: "/diseño.png",
    accesorios: "/accesorios.png",
  };

  return (
    <>
      <Header categories={categories} />

      <main className="min-w-0 overflow-x-hidden">
        {/* Hero */}
        <HeroSlider slides={heroSlides} />

        {/* Productos destacados - justo después del hero */}
        {featured.length > 0 && (
          <section className="bg-white py-8 md:py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-6 flex items-center justify-between md:mb-8">
                <h2 className="text-xl font-bold text-[#1d1d1b] md:text-2xl">Destacados</h2>
                <Link href="/destacados" className="text-sm font-medium text-[#0f3bff] hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {featured.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={Number(product.price)}
                    compareAtPrice={product.compareAtPrice ? Number(product.compareAtPrice) : null}
                    images={product.images}
                    category={product.category}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categorías - mobile: links, desktop: cards con iconos */}
        <section className="border-t border-black/8 bg-gray-50 py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-6 text-xl font-bold text-[#1d1d1b] md:mb-8 md:text-2xl">Explorar por categoría</h2>
            {/* Mobile: grid simétrico 3 columnas, fila inferior centrada */}
            <div className="grid grid-cols-3 gap-2 md:hidden">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="flex min-h-[44px] items-center justify-center rounded-lg bg-white px-3 py-2.5 text-center text-sm font-medium shadow-sm transition hover:shadow-md"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            {/* Desktop: cards con iconos */}
            <div className="hidden md:grid md:grid-cols-5 md:gap-4">
              {categories.map((cat) => (
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

        {/* Beneficios - ordenado y centrado en mobile */}
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

        {/* Ofertas */}
        {offers.length > 0 && (
          <section className="border-t border-black/8 bg-gray-50 py-8 md:py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-6 flex items-center justify-between md:mb-8">
                <h2 className="text-xl font-bold text-[#1d1d1b] md:text-2xl">Ofertas imperdibles</h2>
                <Link href="/ofertas" className="text-sm font-medium text-[#0f3bff] hover:underline">
                  Ver todas
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {offers.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={Number(product.price)}
                    compareAtPrice={product.compareAtPrice ? Number(product.compareAtPrice) : null}
                    images={product.images}
                    category={product.category}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
