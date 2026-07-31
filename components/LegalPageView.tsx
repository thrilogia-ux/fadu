import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getAllActiveCategories } from "@/lib/home-data";
import { formatLegalContent, type LegalPageMeta } from "@/lib/legal-pages";

type Props = {
  page: LegalPageMeta;
  breadcrumbs?: { label: string; href?: string }[];
};

export async function LegalPageView({ page, breadcrumbs }: Props) {
  const categories = await getAllActiveCategories();
  const paragraphs = formatLegalContent(page.content);

  const crumbs = breadcrumbs ?? [{ label: page.title }];

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen bg-gray-50 py-8 md:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <nav className="mb-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#0f3bff] hover:underline">
              Inicio
            </Link>
            {crumbs.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`}>
                <span className="mx-2">/</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#0f3bff] hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#1d1d1b]">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          <article className="rounded-xl border border-black/8 bg-white p-6 shadow-sm md:p-10">
            <h1 className="mb-6 text-2xl font-bold text-[#1d1d1b] md:text-3xl">{page.title}</h1>
            <div className="space-y-4 text-[15px] leading-relaxed text-gray-700">
              {paragraphs.map((paragraph, i) => (
                <p key={i} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Necesitás ayuda?{" "}
            <a
              href="https://wa.me/5491168333363?text=Hola%2C%20consulta%20desde%20Fadu.store"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#0f3bff] hover:underline"
            >
              Escribinos por WhatsApp
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
