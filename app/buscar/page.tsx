import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";

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
        include: {
          category: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      })
    : [];

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen bg-[#ededed] py-6">
        <div className="mx-auto max-w-7xl px-4">
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
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <p className="text-gray-600">Ingresá un término de búsqueda para comenzar</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <p className="text-gray-600">No encontramos productos para "{query}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
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
