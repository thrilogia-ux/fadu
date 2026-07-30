import { prisma } from "@/lib/prisma";

export type FairModeSettings = {
  enabled: boolean;
  title: string;
  message: string;
  hideMercadoPago: boolean;
};

const DEFAULTS: FairModeSettings = {
  enabled: false,
  title: "Modo feria FADU",
  message: "Compra rápida en el stand. Retirá en el pickup con tu QR.",
  hideMercadoPago: true,
};

function parseBool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

export async function getFairModeSettings(): Promise<FairModeSettings> {
  try {
    const rows = await prisma.storeSetting.findMany({
      where: {
        key: {
          in: [
            "fair_mode_enabled",
            "fair_mode_title",
            "fair_mode_message",
            "fair_mode_hide_mercadopago",
          ],
        },
      },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      enabled: parseBool(map.get("fair_mode_enabled"), DEFAULTS.enabled),
      title: map.get("fair_mode_title")?.trim() || DEFAULTS.title,
      message: map.get("fair_mode_message")?.trim() || DEFAULTS.message,
      hideMercadoPago: parseBool(map.get("fair_mode_hide_mercadopago"), DEFAULTS.hideMercadoPago),
    };
  } catch {
    return DEFAULTS;
  }
}

export async function upsertFairModeSettings(settings: FairModeSettings): Promise<void> {
  const entries: [string, string][] = [
    ["fair_mode_enabled", settings.enabled ? "true" : "false"],
    ["fair_mode_title", settings.title],
    ["fair_mode_message", settings.message],
    ["fair_mode_hide_mercadopago", settings.hideMercadoPago ? "true" : "false"],
  ];
  for (const [key, value] of entries) {
    await prisma.storeSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
