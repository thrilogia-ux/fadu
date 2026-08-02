import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EmptyState } from "@/components/EmptyState";
import { ProductCatalogCard } from "@/components/ProductCatalogCard";
import { catalogListInclude, mapProductToCatalog } from "@/lib/catalog-product-map";

export const dynamic = "force-dynamic";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || "").trim();

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const products = query
    ? await prisma.product.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 48,
        include: catalogListInclude,
      })
    : [];

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen overflow-x-hidden bg-[#ededed] py-6 pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <nav
            className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600"
            aria-label="Migas de pan"
          >
            <Link href="/" className="shrink-0 hover:text-[#0f3bff]">
              Inicio
            </Link>
            <span className="text-gray-400" aria-hidden>
              ›
            </span>
            <span className="text-gray-800">Buscar</span>
          </nav>

          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-[#1d1d1b] md:text-2xl">
              {query ? `Resultados para "${query}"` : "Buscar productos"}
            </h1>
            <p className="mt-2 text-gray-600">
              {query
                ? `${products.length} ${products.length === 1 ? "producto encontrado" : "productos encontrados"}`
                : "Escribí en la barra de búsqueda para buscar productos"}
            </p>
          </div>

          {!query ? (
            <div className="rounded-lg bg-white px-6 py-14 text-center shadow-sm sm:py-16">
              <p className="text-gray-600">Usá la lupa en el encabezado o escribí arriba qué buscás.</p>
              <Link
                href="/productos"
                className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#0f3bff] px-6 font-semibold text-white transition hover:bg-[#0d32cc]"
              >
                Ver catálogo
              </Link>
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon="🔍"
              title={`No encontramos productos para "${query}"`}
              description="Probá con otras palabras, navegá por categoría o mirá las ofertas del momento."
              primaryHref="/productos"
              primaryLabel="Ver todos los productos"
              secondaryHref="/ofertas"
              secondaryLabel="Ver ofertas"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCatalogCard
                  key={product.id}
                  {...mapProductToCatalog({
                    ...product,
                    images: product.images.map((img) => ({ url: img.url })),
                  })}
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
