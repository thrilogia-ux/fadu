import { HelpCenterView } from "@/components/HelpCenterView";
import { getLegalPage, parseFaqItems } from "@/lib/legal-pages";
import { getAllActiveCategories } from "@/lib/home-data";
import { getPickupInfo } from "@/lib/pickup";

export const dynamic = "force-dynamic";

export default async function AyudaPage() {
  const [page, categories, pickup] = await Promise.all([
    getLegalPage("ayuda"),
    getAllActiveCategories(),
    getPickupInfo(),
  ]);

  return (
    <HelpCenterView
      faqPage={page}
      faqItems={parseFaqItems(page.content)}
      categories={categories}
      pickup={pickup}
    />
  );
}
