import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CategoryPageHeader } from "@/components/CategoryPageHeader";
import { ProductCatalogCard } from "@/components/ProductCatalogCard";
import { EmptyState } from "@/components/EmptyState";
import { catalogListInclude, mapProductToCatalog } from "@/lib/catalog-product-map";
import { notFound } from "next/navigation";
import Link from "next/link";

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
    include: catalogListInclude,
  });

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen overflow-x-hidden bg-[#ededed] py-6 pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
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

          <CategoryPageHeader
            name={category.name}
            slug={category.slug}
            productCount={products.length}
          />

          {products.length === 0 ? (
            <EmptyState
              icon="📂"
              title={`Todavía no hay productos en ${category.name}`}
              description="Volvé pronto o explorá el resto del catálogo para descubrir novedades."
              primaryHref="/productos"
              primaryLabel="Ver todos los productos"
              secondaryHref="/"
              secondaryLabel="Ir al inicio"
            />
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
