import { prisma } from "@/lib/prisma";

export type FairModeType = "off" | "pickup_qr" | "presencial";

export type FairModeSettings = {
  mode: FairModeType;
  /** @deprecated Use `mode !== "off"` — kept for backward compatibility */
  enabled: boolean;
  title: string;
  message: string;
  hideMercadoPago: boolean;
};

const DEFAULTS: FairModeSettings = {
  mode: "off",
  enabled: false,
  title: "Modo feria FADU",
  message: "Compra rápida en el stand. Retirá en el pickup con tu QR.",
  hideMercadoPago: true,
};

const MODE_DEFAULTS: Record<Exclude<FairModeType, "off">, Pick<FairModeSettings, "title" | "message">> = {
  pickup_qr: {
    title: "Feria FADU — retiro con QR",
    message: "Comprá ahora y retirá tu pedido en el Pickup Point de FADU con el código QR del email.",
  },
  presencial: {
    title: "Feria FADU — venta en el stand",
    message: "Te llevás el producto al instante. El stock se descuenta al confirmar la compra.",
  },
};

function parseBool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

function parseMode(raw: string | undefined, enabledLegacy: boolean): FairModeType {
  if (raw === "pickup_qr" || raw === "presencial" || raw === "off") {
    return raw;
  }
  return enabledLegacy ? "pickup_qr" : "off";
}

export function fairModeIsActive(settings: FairModeSettings): boolean {
  return settings.mode !== "off";
}

export async function getFairModeSettings(): Promise<FairModeSettings> {
  try {
    const rows = await prisma.storeSetting.findMany({
      where: {
        key: {
          in: [
            "fair_mode_enabled",
            "fair_mode_type",
            "fair_mode_title",
            "fair_mode_message",
            "fair_mode_hide_mercadopago",
          ],
        },
      },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const enabledLegacy = parseBool(map.get("fair_mode_enabled"), DEFAULTS.enabled);
    const mode = parseMode(map.get("fair_mode_type"), enabledLegacy);
    return {
      mode,
      enabled: mode !== "off",
      title: map.get("fair_mode_title")?.trim() || DEFAULTS.title,
      message: map.get("fair_mode_message")?.trim() || DEFAULTS.message,
      hideMercadoPago: parseBool(map.get("fair_mode_hide_mercadopago"), DEFAULTS.hideMercadoPago),
    };
  } catch {
    return DEFAULTS;
  }
}

export async function upsertFairModeSettings(settings: FairModeSettings): Promise<void> {
  const mode = settings.mode;
  const entries: [string, string][] = [
    ["fair_mode_type", mode],
    ["fair_mode_enabled", mode !== "off" ? "true" : "false"],
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

export function fairModePresetForType(type: Exclude<FairModeType, "off">): Pick<FairModeSettings, "title" | "message"> {
  return MODE_DEFAULTS[type];
}
