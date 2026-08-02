import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BrandLoader } from "@/components/BrandLoader";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

type Props = {
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

          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <BrandLoader size="lg" label="Cargando productos…" />
          </div>

          <ProductGridSkeleton count={8} />
        </div>
      </main>

      <Footer />
    </>
  );
}
