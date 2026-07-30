export type StockInput = {
  stock: number;
  useVariants?: boolean;
  variants?: { stock: number }[];
};

export function productInStock(p: StockInput): boolean {
  if (p.useVariants && p.variants && p.variants.length > 0) {
    return p.variants.some((v) => v.stock > 0);
  }
  return p.stock > 0;
}

export function productTotalStock(p: StockInput): number {
  if (p.useVariants && p.variants && p.variants.length > 0) {
    return p.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
  }
  return Math.max(0, p.stock);
}

export function productTypeLabel(productType?: string | null): string | null {
  if (productType === "bundle_pack") return "Pack";
  if (productType === "bundle_combo") return "Combo";
  return null;
}
