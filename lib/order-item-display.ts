/** Nombre para mostrar cuando el producto pudo haberse eliminado (productId → null). */
export function orderItemProductName(item: {
  product?: { name: string } | null;
  productNameSnapshot?: string | null;
}): string {
  const snap = item.productNameSnapshot?.trim();
  if (item.product?.name) return item.product.name;
  if (snap) return snap;
  return "Producto";
}
