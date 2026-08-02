import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

type Props = {
  /** Título placeholder en el header del catálogo */
  variant?: "catalog" | "category";
};

export function CatalogLoadingPage({ variant = "catalog" }: Props) {
  return (
    <>
      <Header categories={[]} />

      <main className="min-h-screen overflow-x-hidden bg-[#ededed] py-6 pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          {variant === "category" ? (
            <nav className="mb-4 flex animate-pulse gap-2">
              <div className="h-4 w-12 rounded bg-gray-200" />
              <div className="h-4 w-4 rounded bg-gray-200" />
              <div className="h-4 w-28 rounded bg-gray-200" />
            </nav>
          ) : null}

          <div className="mb-6 animate-pulse rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              {variant === "category" ? (
                <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-200" />
              ) : null}
              <div className="flex-1 space-y-2">
                <div className="h-8 w-56 max-w-full rounded bg-gray-200" />
                <div className="h-4 w-36 rounded bg-gray-200" />
              </div>
            </div>
          </div>

          <ProductGridSkeleton count={12} />
        </div>
      </main>

      <Footer />
    </>
  );
}
