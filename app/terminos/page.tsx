import { LegalPageView } from "@/components/LegalPageView";
import { getLegalPage } from "@/lib/legal-pages";

export const dynamic = "force-dynamic";

export default async function TerminosPage() {
  const page = await getLegalPage("terminos");
  return <LegalPageView page={page} breadcrumbs={[{ label: "Términos y condiciones" }]} />;
}
