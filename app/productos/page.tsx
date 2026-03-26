import { prisma } from "@/lib/prisma";
import { runWithDbRetries } from "@/lib/db-retry";
import { mergeHomeCategories } from "@/lib/home-fallback";

export const dynamic = "force-dynamic";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";

export default async function ProductosPage() {
  const categoriesRaw =
    (await runWithDbRetries("productos.categories", () =>
      prisma.category.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
        select: { id: true, name: true, slug: true },
      })
    )) ?? [];

  const products =
    (await runWithDbRetries("productos.products", () =>
      prisma.product.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      })
    )) ?? [];

  const categories = mergeHomeCategories(categoriesRaw);

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen overflow-x-hidden bg-[#ededed] py-6 pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-[#1d1d1b]">
              Todos los productos
            </h1>
            <p className="mt-2 text-gray-600">
              {products.length} productos disponibles
            </p>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <p className="text-gray-600">
                No pudimos cargar el catálogo ahora. Probá actualizar la página; si sigue vacío, el
                servidor no está pudiendo conectar con la base de datos.
              </p>
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
