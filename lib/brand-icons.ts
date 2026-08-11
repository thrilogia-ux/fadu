export const BRAND_ICONS = {
  perfil: "/icons/perfil.png",
  envioDomicilio: "/icons/envio-domicilio.png",
  carrito: "/icons/carrito.png",
  misCompras: "/icons/mis-compras.png",
  retiroFadu: "/icons/retiro-fadu.png",
  tarjetas: "/icons/tarjetas.png",
  transferencia: "/icons/transferencia.png",
} as const;

/** Ilustraciones collage solo para los 3 destacados del home. */
export const HOME_HIGHLIGHT_ICONS = {
  retiroFadu: "/home/retiro-en-fadu.png",
  pagaComoQuieras: "/home/paga-como-quieras.png",
  compraSegura: "/home/compra-segura.png",
} as const;

export type BrandIconName = keyof typeof BRAND_ICONS;
