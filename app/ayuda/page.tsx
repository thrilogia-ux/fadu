import { LegalPageView } from "@/components/LegalPageView";
import { getLegalPage } from "@/lib/legal-pages";

export const dynamic = "force-dynamic";

export default async function AyudaPage() {
  const page = await getLegalPage("ayuda");
  return <LegalPageView page={page} breadcrumbs={[{ label: "Ayuda" }]} />;
}
