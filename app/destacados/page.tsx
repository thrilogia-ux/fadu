import { prisma } from "@/lib/prisma";
import { homeFeaturedOrderBy } from "@/lib/product-list-order";

export const dynamic = "force-dynamic";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCatalogCard } from "@/components/ProductCatalogCard";
import { catalogListInclude, mapProductToCatalog } from "@/lib/catalog-product-map";
import Image from "next/image";

export default async function DestacadosPage() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const products = await prisma.product.findMany({
    where: { active: true, featured: true },
    orderBy: homeFeaturedOrderBy,
    include: catalogListInclude,
  });

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen overflow-x-hidden bg-[#ededed] py-6 pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <h1 className="flex items-center gap-3 text-2xl font-bold text-[#1d1d1b]">
              <div className="relative h-8 w-8">
                <Image src="/star.png" alt="" fill className="object-contain" unoptimized />
              </div>
              Productos destacados
            </h1>
            <p className="mt-2 text-gray-600">
              Los mejores productos seleccionados para vos
            </p>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <p className="text-gray-600">No hay productos destacados</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCatalogCard key={product.id} {...mapProductToCatalog(product)} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
