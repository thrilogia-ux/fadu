/** Identifica una línea del carrito (producto simple o producto + variante) */
export function cartLineKey(item: { productId: string; variantId?: string | null }): string {
  const v = item.variantId?.trim();
  return v ? `${item.productId}::${v}` : item.productId;
}

/** Orden visual S–XXL; el resto alfabético */
export function sortSizeLabels(sizes: string[]): string[] {
  const order = ["S", "M", "L", "XL", "XXL"];
  return [...new Set(sizes)].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function formatVariantLabel(
  sizeLabel: string,
  colorLabel: string,
  opts: { showSize: boolean; showColor: boolean }
): string {
  const parts: string[] = [];
  if (opts.showSize && sizeLabel.trim()) parts.push(`Talle ${sizeLabel.trim()}`);
  if (opts.showColor && colorLabel.trim()) parts.push(colorLabel.trim());
  if (parts.length === 0) return "";
  return parts.join(" · ");
}
