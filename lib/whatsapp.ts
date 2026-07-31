import { STORE_NAME } from "./brand";

export const DEFAULT_WHATSAPP_PHONE = "5491168333363";

export function getWhatsAppPhone(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_WHATSAPP_PHONE;
}

/** Normaliza teléfonos argentinos para wa.me (solo dígitos, con prefijo 54). */
export function normalizeWhatsAppPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;

  if (digits.startsWith("54") && digits.length >= 12) return digits;
  if (digits.startsWith("549") && digits.length >= 12) return digits;
  if (digits.length === 11 && digits.startsWith("9")) return `54${digits}`;
  if (digits.length === 10 && digits.startsWith("11")) return `549${digits}`;
  if (digits.length === 10 && digits.startsWith("15")) return `54911${digits.slice(2)}`;

  return digits.startsWith("54") ? digits : `54${digits}`;
}

export function publicSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  const u = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return u ? u.replace(/\/$/, "") : "https://fadustore.vercel.app";
}

export function buildWhatsAppUrl(message: string, phone?: string): string {
  const digits = (phone ?? getWhatsAppPhone()).replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export type PickupReadyNotifyOptions = {
  customerName?: string | null;
  pickupCode: string;
  orderId?: string;
  address?: string;
  scheduleLines?: string[];
};

/** Mensaje que el admin envía al cliente cuando el pedido está listo para retirar. */
export function buildPickupReadyNotifyMessage(options: PickupReadyNotifyOptions): string {
  const greeting = options.customerName?.trim()
    ? `Hola ${options.customerName.trim()}!`
    : "Hola!";

  const lines = [
    greeting,
    "",
    `Tu pedido *${options.pickupCode}* está listo para retirar en el Pickup Point de FADU.`,
  ];

  if (options.address) {
    lines.push("", `📍 ${options.address}`);
  }

  if (options.scheduleLines && options.scheduleLines.length > 0) {
    lines.push("", "Horarios de retiro:");
    options.scheduleLines.forEach((l) => lines.push(`• ${l}`));
  }

  lines.push(
    "",
    "Presentá el código del email o tu número de pedido al retirar."
  );

  if (options.orderId) {
    lines.push("", `Ver pedido: ${publicSiteUrl()}/pedido/${options.orderId}`);
  }

  lines.push("", `— ${STORE_NAME}`);
  return lines.join("\n");
}

export function buildPickupReadyNotifyUrl(
  customerPhone: string,
  options: PickupReadyNotifyOptions
): string | null {
  const normalized = normalizeWhatsAppPhone(customerPhone);
  if (!normalized) return null;
  return buildWhatsAppUrl(buildPickupReadyNotifyMessage(options), normalized);
}

export function buildOrderPickupWhatsAppMessage(
  pickupCode: string,
  options?: { scheduleLines?: string[]; address?: string }
): string {
  const lines = [
    `Hola! Mi pedido *${pickupCode}* está listo para retiro en FADU.`,
    "",
    "Quería consultar por el retiro.",
  ];

  if (options?.address) {
    lines.push("", `Dirección: ${options.address}`);
  }

  if (options?.scheduleLines && options.scheduleLines.length > 0) {
    lines.push("", "Horarios de retiro:");
    options.scheduleLines.forEach((l) => lines.push(`• ${l}`));
  }

  lines.push("", "Gracias!");
  return lines.join("\n");
}

export const DEFAULT_WHATSAPP_GREETING =
  `Hola! Tengo una consulta sobre ${STORE_NAME}`;
