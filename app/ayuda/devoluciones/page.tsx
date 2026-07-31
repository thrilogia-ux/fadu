import { LegalPageView } from "@/components/LegalPageView";
import { getLegalPage } from "@/lib/legal-pages";

export const dynamic = "force-dynamic";

export default async function AyudaDevolucionesPage() {
  const page = await getLegalPage("ayuda-devoluciones");
  return (
    <LegalPageView
      page={page}
      breadcrumbs={[
        { label: "Ayuda", href: "/ayuda" },
        { label: "Devoluciones" },
      ]}
    />
  );
}
