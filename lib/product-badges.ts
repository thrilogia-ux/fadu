const NEW_PRODUCT_DAYS = 30;
const LOW_STOCK_THRESHOLD = 5;

export function isProductNew(createdAt?: Date | string | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const diffMs = Date.now() - created.getTime();
  return diffMs >= 0 && diffMs <= NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
}

export function lowStockLabel(totalStock: number, inStock: boolean): string | null {
  if (!inStock || totalStock <= 0) return null;
  if (totalStock <= LOW_STOCK_THRESHOLD) {
    return totalStock === 1 ? "Última unidad" : `Últimas ${totalStock}`;
  }
  return null;
}

export function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}
