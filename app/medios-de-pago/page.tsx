import { LegalPageView } from "@/components/LegalPageView";
import { getLegalPage } from "@/lib/legal-pages";

export const dynamic = "force-dynamic";

export default async function MediosDePagoPage() {
  const page = await getLegalPage("medios-de-pago");
  return <LegalPageView page={page} breadcrumbs={[{ label: "Medios de pago" }]} />;
}
