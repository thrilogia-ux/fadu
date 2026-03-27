/**
 * Orden de grilla alineado con /admin/portada y GET /api/admin/home-order.
 * Los índices vienen del PATCH que guarda featuredOrder / offersOrder.
 */
export const homeFeaturedOrderBy = [
  { featuredOrder: "asc" as const },
  { createdAt: "desc" as const },
];

export const homeOffersOrderBy = [
  { offersOrder: "asc" as const },
  { createdAt: "desc" as const },
];
