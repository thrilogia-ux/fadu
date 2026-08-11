export type CartLineForShipping = {
  quantity: number;
  weightKg?: number | null;
  heightCm?: number | null;
  widthCm?: number | null;
  depthCm?: number | null;
};

export type ShippingPackageSummary = {
  totalWeightKg: number;
  paquetesParam: string;
  packages: { alto: number; ancho: number; largo: number; peso: number }[];
};

const DEFAULT_WEIGHT_KG = 0.5;
const DEFAULT_DIM = { alto: 20, ancho: 15, largo: 10 };

export function estimateShippingFromCart(lines: CartLineForShipping[]): ShippingPackageSummary {
  let totalWeight = 0;
  let maxAlto = DEFAULT_DIM.alto;
  let maxAncho = DEFAULT_DIM.ancho;
  let maxLargo = DEFAULT_DIM.largo;
  let itemCount = 0;

  for (const line of lines) {
    const qty = Math.max(1, line.quantity);
    itemCount += qty;
    const w = line.weightKg != null && line.weightKg > 0 ? line.weightKg : DEFAULT_WEIGHT_KG;
    totalWeight += w * qty;

    if (line.heightCm && line.heightCm > maxAlto) maxAlto = Math.round(line.heightCm);
    if (line.widthCm && line.widthCm > maxAncho) maxAncho = Math.round(line.widthCm);
    if (line.depthCm && line.depthCm > maxLargo) maxLargo = Math.round(line.depthCm);
  }

  if (itemCount === 0) {
    totalWeight = DEFAULT_WEIGHT_KG;
  }

  // Un solo bulto consolidado (MVP)
  const weight = Math.max(0.1, Math.round(totalWeight * 100) / 100);
  const pkg = { alto: maxAlto, ancho: maxAncho, largo: maxLargo, peso: weight };
  const paquetesParam = `${pkg.alto}x${pkg.ancho}x${pkg.largo}`;

  return {
    totalWeightKg: weight,
    paquetesParam,
    packages: [pkg],
  };
}
