import { LegalPageView } from "@/components/LegalPageView";
import { getLegalPage } from "@/lib/legal-pages";

export const dynamic = "force-dynamic";

export default async function AyudaComprarPage() {
  const page = await getLegalPage("ayuda-comprar");
  return (
    <LegalPageView
      page={page}
      breadcrumbs={[
        { label: "Ayuda", href: "/ayuda" },
        { label: "Cómo comprar" },
      ]}
    />
  );
}
