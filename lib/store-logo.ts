import { prisma } from "@/lib/prisma";

export const DEFAULT_HEADER_LOGO = "/ubafadushop-logo.svg";
export const DEFAULT_FOOTER_LOGO = "/ubafadushop-logo-gris.svg";

export type StoreLogoSettings = {
  headerUrl: string | null;
  footerUrl: string | null;
  useSameForFooter: boolean;
  headerHeight: number;
  footerHeight: number;
};

export const DEFAULT_STORE_LOGO_SETTINGS: StoreLogoSettings = {
  headerUrl: null,
  footerUrl: null,
  useSameForFooter: true,
  headerHeight: 58,
  footerHeight: 58,
};

const STORAGE_KEY = "store_logo";

const MIN_HEIGHT = 36;
const MAX_HEIGHT = 100;

function clampHeight(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(n)));
}

function normalizeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function normalizeStoreLogoSettings(raw: unknown): StoreLogoSettings {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    headerUrl: normalizeUrl(o.headerUrl),
    footerUrl: normalizeUrl(o.footerUrl),
    useSameForFooter: o.useSameForFooter !== false,
    headerHeight: clampHeight(o.headerHeight, DEFAULT_STORE_LOGO_SETTINGS.headerHeight),
    footerHeight: clampHeight(o.footerHeight, DEFAULT_STORE_LOGO_SETTINGS.footerHeight),
  };
}

export function resolveHeaderLogo(settings: StoreLogoSettings): string {
  return settings.headerUrl ?? DEFAULT_HEADER_LOGO;
}

export function resolveFooterLogo(settings: StoreLogoSettings): string {
  if (settings.useSameForFooter) {
    return settings.headerUrl ?? settings.footerUrl ?? DEFAULT_FOOTER_LOGO;
  }
  return settings.footerUrl ?? DEFAULT_FOOTER_LOGO;
}

/** Alturas responsive proporcionales al valor base (mobile). */
export function logoResponsiveSizes(baseHeight: number) {
  return {
    mobile: baseHeight,
    md: Math.round(baseHeight * 1.24),
    lg: Math.round(baseHeight * 1.38),
    maxMobile: Math.round(baseHeight * 4),
    maxMd: Math.round(baseHeight * 3.33),
    maxLg: Math.round(baseHeight * 3.25),
  };
}

export async function getStoreLogoSettings(): Promise<StoreLogoSettings> {
  const row = await prisma.storeSetting.findUnique({ where: { key: STORAGE_KEY } });
  if (!row?.value) return { ...DEFAULT_STORE_LOGO_SETTINGS };
  try {
    return normalizeStoreLogoSettings(JSON.parse(row.value));
  } catch {
    return { ...DEFAULT_STORE_LOGO_SETTINGS };
  }
}

export async function saveStoreLogoSettings(input: unknown): Promise<StoreLogoSettings> {
  const settings = normalizeStoreLogoSettings(input);

  if (!settings.useSameForFooter && !settings.headerUrl && !settings.footerUrl) {
    // Permitir volver al logo por defecto en ambos
  }

  await prisma.storeSetting.upsert({
    where: { key: STORAGE_KEY },
    create: { key: STORAGE_KEY, value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });

  return settings;
}
