import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category || !category.active) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: {
      active: true,
      categoryId: category.id,
    },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  // Iconos por categoría (PNG en public)
  const categoryIcons: Record<string, string> = {
    iluminacion: "/iluminacion.png",
    escritorio: "/escritorio.png",
    decoracion: "/decoracion.png",
    diseno: "/diseño.png",
    accesorios: "/accesorios.png",
  };

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen overflow-x-hidden bg-[#ededed] py-6 pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav
            className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 overflow-x-auto pb-1 text-sm text-gray-600"
            aria-label="Migas de pan"
          >
            <Link href="/" className="shrink-0 hover:text-[#0f3bff]">
              Inicio
            </Link>
            <span className="text-gray-400" aria-hidden>
              ›
            </span>
            <span className="text-gray-800">{category.name}</span>
          </nav>

          {/* Header de categoría */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 flex-shrink-0">
                <Image
                  src={categoryIcons[category.slug] || "/accesorios.png"}
                  alt=""
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1d1d1b]">{category.name}</h1>
                <p className="mt-1 text-gray-600">
                  {products.length} {products.length === 1 ? "producto" : "productos"} disponibles
                </p>
              </div>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg bg-white px-6 py-14 text-center shadow-sm sm:py-16">
              <p className="font-medium text-[#1d1d1b]">Todavía no hay productos en {category.name}</p>
              <p className="mt-2 text-sm text-gray-600">Volvé pronto o explorá el resto del catálogo.</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/productos"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#0f3bff] px-6 font-semibold text-white transition hover:bg-[#0d32cc]"
                >
                  Ver todos los productos
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-black/15 px-6 font-medium text-[#1d1d1b] hover:bg-gray-50"
                >
                  Ir al inicio
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
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
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
