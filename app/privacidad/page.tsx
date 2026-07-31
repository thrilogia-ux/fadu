import { LegalPageView } from "@/components/LegalPageView";
import { getLegalPage } from "@/lib/legal-pages";

export const dynamic = "force-dynamic";

export default async function PrivacidadPage() {
  const page = await getLegalPage("privacidad");
  return <LegalPageView page={page} breadcrumbs={[{ label: "Privacidad" }]} />;
}
