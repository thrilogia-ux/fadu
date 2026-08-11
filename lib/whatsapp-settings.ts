import { prisma } from "@/lib/prisma";
import { DEFAULT_WHATSAPP_GREETING, DEFAULT_WHATSAPP_PHONE } from "@/lib/whatsapp";

export type WhatsAppSettings = {
  /** Teléfono de la tienda (solo dígitos, formato 54911...) */
  phone: string;
  /** Mensaje del botón flotante */
  floatingGreeting: string;
  /** Mostrar botón flotante en el sitio */
  floatingEnabled: boolean;
  /** Sugerir aviso por WhatsApp al admin cuando el pedido está listo (retiro) */
  notifyOnPickupReady: boolean;
  /** Sugerir aviso por WhatsApp al admin cuando el pedido fue enviado */
  notifyOnShipped: boolean;
};

const STORAGE_KEY = "whatsapp_settings";

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = {
  phone: DEFAULT_WHATSAPP_PHONE,
  floatingGreeting: DEFAULT_WHATSAPP_GREETING,
  floatingEnabled: true,
  notifyOnPickupReady: true,
  notifyOnShipped: true,
};

function normalizePhone(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_WHATSAPP_PHONE;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 ? digits : DEFAULT_WHATSAPP_PHONE;
}

export function normalizeWhatsAppSettings(raw: unknown): WhatsAppSettings {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const greeting =
    typeof o.floatingGreeting === "string" && o.floatingGreeting.trim()
      ? o.floatingGreeting.trim().slice(0, 500)
      : DEFAULT_WHATSAPP_GREETING;

  return {
    phone: normalizePhone(o.phone),
    floatingGreeting: greeting,
    floatingEnabled: o.floatingEnabled !== false,
    notifyOnPickupReady: o.notifyOnPickupReady !== false,
    notifyOnShipped: o.notifyOnShipped !== false,
  };
}

export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  const row = await prisma.storeSetting.findUnique({ where: { key: STORAGE_KEY } });
  if (!row?.value) return { ...DEFAULT_WHATSAPP_SETTINGS };
  try {
    return normalizeWhatsAppSettings(JSON.parse(row.value));
  } catch {
    return { ...DEFAULT_WHATSAPP_SETTINGS };
  }
}

export async function saveWhatsAppSettings(input: unknown): Promise<WhatsAppSettings> {
  const settings = normalizeWhatsAppSettings(input);
  await prisma.storeSetting.upsert({
    where: { key: STORAGE_KEY },
    create: { key: STORAGE_KEY, value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
  return settings;
}

/** Teléfono efectivo: settings DB → env → default */
export async function getStoreWhatsAppPhone(): Promise<string> {
  const settings = await getWhatsAppSettings();
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.trim()?.replace(/\D/g, "");
  if (fromEnv && fromEnv.length >= 10) return fromEnv;
  return settings.phone;
}
