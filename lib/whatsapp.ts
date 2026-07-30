export const DEFAULT_WHATSAPP_PHONE = "5491168333363";

export function getWhatsAppPhone(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_WHATSAPP_PHONE;
}

export function buildWhatsAppUrl(message: string, phone?: string): string {
  const digits = (phone ?? getWhatsAppPhone()).replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
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
  "Hola! Tengo una consulta sobre Fadu.store";
