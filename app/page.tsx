import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { HeroSlider } from "@/components/HeroSlider";
import Link from "next/link";

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
    },
  });

  // Categorías activas
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  });

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
    iluminacion: "💡",
    muebles: "🪑",
    decoracion: "🎨",
    "herramientas-diseno": "✏️",
    arquitectura: "🏛️",
  };

  return (
    <>
      <Header categories={categories} />

      <main>
        {/* Hero Slider */}
        <HeroSlider slides={heroSlides} />

        {/* Beneficios */}
        <section className="border-b border-black/8 bg-white py-8">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
                📍
              </div>
              <div>
                <h3 className="font-semibold">Retiro en FADU</h3>
                <p className="text-sm text-gray-600">Tu pedido listo en 7 días</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">
                💳
              </div>
              <div>
                <h3 className="font-semibold">Pagá como quieras</h3>
                <p className="text-sm text-gray-600">Mercado Pago o transferencia</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl">
                🔒
              </div>
              <div>
                <h3 className="font-semibold">Compra segura</h3>
                <p className="text-sm text-gray-600">Tus datos están protegidos</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categorías */}
        <section className="bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-8 text-2xl font-bold text-[#1d1d1b]">Explorar por categoría</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug}`}
                  className="flex flex-col items-center justify-center gap-3 rounded-lg border border-black/8 bg-white p-6 transition hover:shadow-lg"
                >
                  <span className="text-4xl">{iconsByCategory[cat.slug] || "📦"}</span>
                  <span className="text-center text-sm font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Productos destacados */}
        {featured.length > 0 && (
          <section className="bg-white py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1d1d1b]">Destacados</h2>
                <Link href="/destacados" className="text-sm text-[#0f3bff] hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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

        {/* Ofertas */}
        {offers.length > 0 && (
          <section className="bg-gray-50 py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1d1d1b]">Ofertas imperdibles</h2>
                <Link href="/ofertas" className="text-sm text-[#0f3bff] hover:underline">
                  Ver todas
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
