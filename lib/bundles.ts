import { prisma } from "@/lib/prisma";

export type BundleComponentInfo = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  quantity: number;
  unitPrice: number;
};

export async function getBundleComponents(bundleProductId: string): Promise<BundleComponentInfo[]> {
  const items = await prisma.bundleItem.findMany({
    where: { bundleProductId },
    orderBy: { sortOrder: "asc" },
    include: {
      component: {
        select: { id: true, name: true, slug: true, price: true, active: true },
      },
    },
  });
  return items
    .filter((i) => i.component.active)
    .map((i) => ({
      id: i.id,
      productId: i.component.id,
      name: i.component.name,
      slug: i.component.slug,
      quantity: i.quantity,
      unitPrice: Number(i.component.price),
    }));
}

export function computeComboPrices(
  components: BundleComponentInfo[],
  discountPercent: number | null | undefined
): { sumPrice: number; finalPrice: number } {
  const sumPrice = components.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const pct = Math.min(100, Math.max(0, discountPercent ?? 0));
  const finalPrice = sumPrice * (1 - pct / 100);
  return { sumPrice, finalPrice: Math.round(finalPrice * 100) / 100 };
}

export function isBundleType(productType: string | null | undefined): boolean {
  return productType === "bundle_pack" || productType === "bundle_combo";
}
