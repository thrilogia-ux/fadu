import { Resend } from "resend";
import { generateQRDataURL } from "./qr";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Fadu.store <onboarding@resend.dev>";
// Si está definido, todos los emails se envían a esta dirección (útil para testeo)
const TEST_TO = process.env.RESEND_TEST_TO;

export type OrderForEmail = {
  id: string;
  pickupCode: string | null;
  total: number;
  paymentMethod: string | null;
  items: { quantity: number; price: number; product: { name: string } }[];
  user: { email: string | null; name: string | null };
};

/**
 * Envía email de confirmación de venta
 */
export async function sendOrderConfirmation(order: OrderForEmail): Promise<boolean> {
  if (!resend) return false;

  const itemsList = order.items
    .map((i) => `• ${i.product.name} x${i.quantity} — $${(Number(i.price) * i.quantity).toLocaleString("es-AR")}`)
    .join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1d1d1b;">¡Gracias por tu compra!</h1>
      <p>Hola ${order.user.name || "Cliente"},</p>
      <p>Recibimos tu pedido <strong>#${order.pickupCode || order.id}</strong>.</p>
      <h2>Resumen</h2>
      <pre style="background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto;">${itemsList}</pre>
      <p><strong>Total: $${Number(order.total).toLocaleString("es-AR")}</strong></p>
      <p>Te avisaremos por email cuando tu pedido esté listo para retirar en el Pickup Point de FADU.</p>
      <p>— Fadu.store</p>
    </body>
    </html>
  `;

  const toEmail = TEST_TO || order.user.email;
  if (!toEmail) return false;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Pedido #${order.pickupCode || order.id} confirmado — Fadu.store`,
      html,
    });
    if (error) {
      console.error("Error enviando email de confirmación:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Error enviando email de confirmación:", e);
    return false;
  }
}

/**
 * Envía email con QR para retiro en pickup
 */
export async function sendPickupReadyEmail(order: OrderForEmail): Promise<boolean> {
  if (!resend || !order.pickupCode) return false;

  let qrDataUrl: string;
  try {
    qrDataUrl = await generateQRDataURL(order.pickupCode);
  } catch (e) {
    console.error("Error generando QR:", e);
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1d1d1b;">¡Tu pedido está listo!</h1>
      <p>Hola ${order.user.name || "Cliente"},</p>
      <p>Tu pedido <strong>#${order.pickupCode}</strong> está listo para retirar en el <strong>Pickup Point de FADU</strong>.</p>
      <p>Presentá este código QR al retirar:</p>
      <p style="text-align: center; margin: 24px 0;">
        <img src="${qrDataUrl}" alt="QR ${order.pickupCode}" width="250" height="250" />
      </p>
      <p style="font-size: 18px; font-weight: bold; text-align: center;">Código: ${order.pickupCode}</p>
      <p>— Fadu.store</p>
    </body>
    </html>
  `;

  const toEmail = TEST_TO || order.user.email;
  if (!toEmail) return false;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Retirá tu pedido #${order.pickupCode} — Fadu.store`,
      html,
    });
    if (error) {
      console.error("Error enviando email de pickup:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Error enviando email de pickup:", e);
    return false;
  }
}
