import { prisma } from "@/lib/prisma";

export type ShippingZone = {
  id: string;
  name: string;
  /** Prefijos o CP exactos. Usar "*" para resto del país (fallback). */
  postalCodes: string[];
  price: number;
  active: boolean;
  order: number;
  estimatedDays?: string;
  isDefault?: boolean;
};

export type ShippingSettings = {
  enabled: boolean;
  freeShippingMin: number | null;
  zones: ShippingZone[];
};

const STORAGE_KEY = "shipping_zones";

export const DEFAULT_SHIPPING_ZONES: ShippingZone[] = [
  {
    id: "caba",
    name: "CABA",
    postalCodes: ["10", "11", "12", "13", "14"],
    price: 3500,
    active: true,
    order: 0,
    estimatedDays: "3 a 5 días hábiles",
  },
  {
    id: "gba",
    name: "GBA",
    postalCodes: ["16", "17", "18", "19"],
    price: 4500,
    active: true,
    order: 1,
    estimatedDays: "4 a 7 días hábiles",
  },
  {
    id: "interior",
    name: "Resto del país",
    postalCodes: ["*"],
    price: 6500,
    active: true,
    order: 99,
    estimatedDays: "7 a 12 días hábiles",
    isDefault: true,
  },
];

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  enabled: true,
  freeShippingMin: null,
  zones: DEFAULT_SHIPPING_ZONES,
};

export type ShippingAddress = {
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  notes?: string;
};

export function normalizePostalCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeZone(raw: unknown, index: number): ShippingZone | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) return null;

  const postalRaw = o.postalCodes;
  const postalCodes = Array.isArray(postalRaw)
    ? postalRaw
        .map((p) => (typeof p === "string" ? normalizePostalCode(p) : ""))
        .filter(Boolean)
    : typeof o.postalCodes === "string"
      ? o.postalCodes.split(/[,;\n]+/).map((p) => normalizePostalCode(p)).filter(Boolean)
      : [];

  if (postalCodes.length === 0) return null;

  const price = Number(o.price);
  const id =
    typeof o.id === "string" && o.id.trim() ? o.id.trim() : `zone-${index}-${Date.now().toString(36)}`;

  return {
    id,
    name: name.slice(0, 80),
    postalCodes,
    price: Number.isFinite(price) && price >= 0 ? Math.round(price) : 0,
    active: o.active !== false,
    order: typeof o.order === "number" && Number.isFinite(o.order) ? o.order : index,
    estimatedDays:
      typeof o.estimatedDays === "string" && o.estimatedDays.trim()
        ? o.estimatedDays.trim().slice(0, 120)
        : undefined,
    isDefault: o.isDefault === true,
  };
}

export function normalizeShippingSettings(raw: unknown): ShippingSettings {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const zonesRaw = Array.isArray(o.zones) ? o.zones : DEFAULT_SHIPPING_ZONES;
  const zones = zonesRaw
    .map((z, i) => normalizeZone(z, i))
    .filter((z): z is ShippingZone => z != null)
    .sort((a, b) => a.order - b.order);

  const freeMin = o.freeShippingMin;
  let freeShippingMin: number | null = null;
  if (freeMin != null && freeMin !== "") {
    const n = Number(freeMin);
    if (Number.isFinite(n) && n > 0) freeShippingMin = Math.round(n);
  }

  return {
    enabled: o.enabled !== false,
    freeShippingMin,
    zones: zones.length > 0 ? zones : [...DEFAULT_SHIPPING_ZONES],
  };
}

export function parseShippingSettingsJson(raw: string | null | undefined): ShippingSettings {
  if (!raw?.trim()) return { ...DEFAULT_SHIPPING_SETTINGS, zones: [...DEFAULT_SHIPPING_ZONES] };
  try {
    return normalizeShippingSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SHIPPING_SETTINGS, zones: [...DEFAULT_SHIPPING_ZONES] };
  }
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const row = await prisma.storeSetting.findUnique({ where: { key: STORAGE_KEY } });
  if (!row?.value) {
    return { ...DEFAULT_SHIPPING_SETTINGS, zones: [...DEFAULT_SHIPPING_ZONES] };
  }
  return parseShippingSettingsJson(row.value);
}

export async function saveShippingSettings(input: unknown): Promise<ShippingSettings> {
  const settings = normalizeShippingSettings(input);
  if (settings.zones.length === 0) {
    throw new Error("Debe haber al menos una zona de envío");
  }

  await prisma.storeSetting.upsert({
    where: { key: STORAGE_KEY },
    create: { key: STORAGE_KEY, value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });

  return settings;
}

function zoneMatchesPostcode(zone: ShippingZone, normalizedCp: string): boolean {
  for (const pattern of zone.postalCodes) {
    if (pattern === "*") continue;
    if (normalizedCp === pattern || normalizedCp.startsWith(pattern)) {
      return true;
    }
  }
  return false;
}

function zoneSpecificity(zone: ShippingZone, normalizedCp: string): number {
  let best = zone.isDefault || zone.postalCodes.includes("*") ? 0 : -1;
  for (const pattern of zone.postalCodes) {
    if (pattern === "*") continue;
    if (normalizedCp === pattern) best = Math.max(best, pattern.length + 100);
    else if (normalizedCp.startsWith(pattern)) best = Math.max(best, pattern.length);
  }
  return best;
}

export type ShippingQuoteResult =
  | {
      ok: true;
      zoneId: string;
      zoneName: string;
      price: number;
      originalPrice: number;
      freeShippingApplied: boolean;
      estimatedDays?: string;
      postalCode: string;
    }
  | { ok: false; error: string };

export function quoteShipping(
  postalCode: string,
  settings: ShippingSettings,
  cartSubtotalAfterDiscount: number
): ShippingQuoteResult {
  if (!settings.enabled) {
    return { ok: false, error: "Los envíos no están habilitados en este momento." };
  }

  const normalizedCp = normalizePostalCode(postalCode);
  if (normalizedCp.length < 4) {
    return { ok: false, error: "Ingresá un código postal válido (mínimo 4 caracteres)." };
  }

  const activeZones = settings.zones.filter((z) => z.active);
  if (activeZones.length === 0) {
    return { ok: false, error: "No hay zonas de envío configuradas." };
  }

  const matching = activeZones.filter((z) => zoneMatchesPostcode(z, normalizedCp));
  let zone: ShippingZone | undefined;

  if (matching.length > 0) {
    zone = matching.sort(
      (a, b) => zoneSpecificity(b, normalizedCp) - zoneSpecificity(a, normalizedCp)
    )[0];
  } else {
    zone =
      activeZones.find((z) => z.isDefault || z.postalCodes.includes("*")) ??
      activeZones[activeZones.length - 1];
  }

  if (!zone) {
    return { ok: false, error: "No encontramos envío para ese código postal." };
  }

  const originalPrice = zone.price;
  const freeShippingApplied =
    settings.freeShippingMin != null && cartSubtotalAfterDiscount >= settings.freeShippingMin;
  const price = freeShippingApplied ? 0 : originalPrice;

  return {
    ok: true,
    zoneId: zone.id,
    zoneName: zone.name,
    price,
    originalPrice,
    freeShippingApplied,
    estimatedDays: zone.estimatedDays,
    postalCode: normalizedCp,
  };
}

export function parseShippingAddress(raw: unknown): ShippingAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const recipientName = typeof o.recipientName === "string" ? o.recipientName.trim() : "";
  const street = typeof o.street === "string" ? o.street.trim() : "";
  const city = typeof o.city === "string" ? o.city.trim() : "";
  const state = typeof o.state === "string" ? o.state.trim() : "";
  const postalCode = typeof o.postalCode === "string" ? normalizePostalCode(o.postalCode) : "";
  const notes = typeof o.notes === "string" ? o.notes.trim().slice(0, 300) : undefined;

  if (!recipientName || !street || !city || !postalCode) return null;

  return {
    recipientName: recipientName.slice(0, 120),
    street: street.slice(0, 200),
    city: city.slice(0, 80),
    state: state.slice(0, 80) || "Buenos Aires",
    postalCode,
    notes,
  };
}

export function formatShippingAddressLines(addr: ShippingAddress): string[] {
  const lines = [
    addr.recipientName,
    addr.street,
    `${addr.postalCode} ${addr.city}${addr.state ? `, ${addr.state}` : ""}`,
  ];
  if (addr.notes) lines.push(`Notas: ${addr.notes}`);
  return lines;
}
