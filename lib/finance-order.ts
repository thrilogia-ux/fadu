import { calculateMercadoPagoFee, getFinanceSettings } from "@/lib/finance-settings";

export async function buildPaidOrderUpdate(
  paymentMethod: string | null,
  total: number
): Promise<{ paidAt: Date; platformFee: number | null; netReceived: number | null }> {
  const paidAt = new Date();

  if (paymentMethod === "mercadopago") {
    const settings = await getFinanceSettings();
    const { platformFee, netReceived } = calculateMercadoPagoFee(total, settings);
    return { paidAt, platformFee, netReceived };
  }

  return { paidAt, platformFee: null, netReceived: null };
}
