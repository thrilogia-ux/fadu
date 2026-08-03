import { prisma } from "@/lib/prisma";

export type FinanceSettings = {
  mpCommissionPercent: number;
  mpFixedFee: number;
};

const DEFAULTS: FinanceSettings = {
  mpCommissionPercent: 5.99,
  mpFixedFee: 0,
};

function parseNumber(v: string | undefined, fallback: number): number {
  if (v === undefined) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export async function getFinanceSettings(): Promise<FinanceSettings> {
  try {
    const rows = await prisma.storeSetting.findMany({
      where: {
        key: { in: ["finance_mp_commission_percent", "finance_mp_fixed_fee"] },
      },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      mpCommissionPercent: parseNumber(map.get("finance_mp_commission_percent"), DEFAULTS.mpCommissionPercent),
      mpFixedFee: parseNumber(map.get("finance_mp_fixed_fee"), DEFAULTS.mpFixedFee),
    };
  } catch {
    return DEFAULTS;
  }
}

export async function upsertFinanceSettings(settings: FinanceSettings): Promise<void> {
  const entries: [string, string][] = [
    ["finance_mp_commission_percent", String(settings.mpCommissionPercent)],
    ["finance_mp_fixed_fee", String(settings.mpFixedFee)],
  ];
  for (const [key, value] of entries) {
    await prisma.storeSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

export function calculateMercadoPagoFee(
  total: number,
  settings: FinanceSettings
): { platformFee: number; netReceived: number } {
  const platformFee =
    Math.round((total * (settings.mpCommissionPercent / 100) + settings.mpFixedFee) * 100) / 100;
  const netReceived = Math.round((total - platformFee) * 100) / 100;
  return { platformFee, netReceived };
}
