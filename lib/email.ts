import { Resend } from "resend";
import { generateQRBuffer } from "./qr";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Fadu.store <onboarding@resend.dev>";

/**
 * Solo en desarrollo (`next dev`): si RESEND_TEST_TO tiene valor, todos los mails van ahí.
 * En producción (NODE_ENV=production, p. ej. Vercel) se ignora siempre: los pedidos llegan al email del cliente.
 */
function resendTestOverride(): string | undefined {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }
  const t = process.env.RESEND_TEST_TO?.trim();
  return t && t.length > 0 ? t : undefined;
}

const TEST_TO = resendTestOverride();

function publicShopUrl(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export type OrderForEmail = {
  id: string;
  pickupCode: string | null;
  total: number;
  paymentMethod: string | null;
  items: { quantity: number; price: number; product: { name: string } }[];
  user: { email: string | null; name: string | null };
};

function formatResendError(error: unknown): string {
  if (error == null) return "Error desconocido de Resend";
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

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

export type SendPickupEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Email con QR para retiro: adjunto PNG + cid (Resend suele rechazar o fallar con img data: largos).
 * Si falla, reintenta solo con el código en texto para que el cliente igual reciba el mail.
 */
export async function sendPickupReadyEmail(order: OrderForEmail): Promise<SendPickupEmailResult> {
  if (!resend) {
    return { ok: false, error: "Falta RESEND_API_KEY en el servidor" };
  }
  if (!order.pickupCode) {
    return { ok: false, error: "El pedido no tiene código de retiro" };
  }

  const toRaw = TEST_TO || order.user.email;
  const toEmail = typeof toRaw === "string" ? toRaw.trim() : "";
  if (!toEmail) {
    return { ok: false, error: "El usuario no tiene email en la cuenta" };
  }

  let qrBase64: string;
  try {
    const buf = await generateQRBuffer(order.pickupCode);
    qrBase64 = buf.toString("base64");
  } catch (e) {
    console.error("Error generando QR:", e);
    return { ok: false, error: "No se pudo generar el código QR" };
  }

  const subject = `Retirá tu pedido #${order.pickupCode} — Fadu.store`;
  const textBody = `Hola ${order.user.name || "Cliente"},\n\nTu pedido #${order.pickupCode} está listo para retirar en el Pickup Point de FADU.\n\nCódigo: ${order.pickupCode}\n\nPresentá el QR del mail o este código al retirar.\n— Fadu.store`;

  const htmlWithCid = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1d1d1b;">¡Tu pedido está listo!</h1>
      <p>Hola ${order.user.name || "Cliente"},</p>
      <p>Tu pedido <strong>#${order.pickupCode}</strong> está listo para retirar en el <strong>Pickup Point de FADU</strong>.</p>
      <p>Presentá este código QR al retirar:</p>
      <p style="text-align: center; margin: 24px 0;">
        <img src="cid:pickupqr" alt="QR ${order.pickupCode}" width="250" height="250" />
      </p>
      <p style="font-size: 18px; font-weight: bold; text-align: center;">Código: ${order.pickupCode}</p>
      <p>— Fadu.store</p>
    </body>
    </html>
  `;

  const htmlFallback = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1d1d1b;">¡Tu pedido está listo!</h1>
      <p>Hola ${order.user.name || "Cliente"},</p>
      <p>Tu pedido <strong>#${order.pickupCode}</strong> está listo para retirar en el <strong>Pickup Point de FADU</strong>.</p>
      <p style="font-size: 18px; font-weight: bold; text-align: center; margin: 24px 0;">Código para retirar: ${order.pickupCode}</p>
      <p>Si no ves el QR en otro correo, usá este código en el pickup.</p>
      <p>— Fadu.store</p>
    </body>
    </html>
  `;

  try {
    const attempt1 = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject,
      html: htmlWithCid,
      text: textBody,
      attachments: [
        {
          filename: "pickup-qr.png",
          content: qrBase64,
          contentType: "image/png",
          contentId: "pickupqr",
        },
      ],
    });
    if (!attempt1.error) {
      return { ok: true };
    }
    const err1 = formatResendError(attempt1.error);
    console.error("[email] pickup con adjunto CID, Resend:", attempt1.error);

    const attempt2 = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject,
      html: htmlFallback,
      text: textBody,
    });
    if (!attempt2.error) {
      return { ok: true };
    }
    const err2 = formatResendError(attempt2.error);
    console.error("[email] pickup fallback texto, Resend:", attempt2.error);
    return { ok: false, error: `${err1} | fallback: ${err2}` };
  } catch (e) {
    console.error("Error enviando email de pickup:", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export type OrderThankYouForEmail = {
  pickupCode: string | null;
  user: { email: string | null; name: string | null };
};

/** Tras retiro validado en pickup: gracias + CTA a la tienda */
export async function sendPickupThankYouEmail(order: OrderThankYouForEmail): Promise<boolean> {
  if (!resend) return false;

  const shop = publicShopUrl();
  const code = order.pickupCode || "";
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1d1d1b;">¡Gracias por retirar tu pedido!</h1>
      <p>Hola ${order.user.name || "Cliente"},</p>
      <p>Confirmamos el retiro${code ? ` del pedido <strong>#${code}</strong>` : " de tu pedido"} en el Pickup Point de FADU.</p>
      <p>Esperamos que disfrutes tu compra. Cuando quieras volver a ver novedades y ofertas, entrá a la tienda:</p>
      <p style="margin: 28px 0;">
        <a href="${shop}/productos" style="display: inline-block; background: #0f3bff; color: #fff; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Volver a comprar en Fadu.store
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">— Fadu.store</p>
    </body>
    </html>
  `;

  const toEmail = TEST_TO || order.user.email;
  if (!toEmail) return false;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `¡Gracias por tu compra!${code ? ` Pedido #${code}` : ""} — Fadu.store`,
      html,
    });
    if (error) {
      console.error("Error enviando email de agradecimiento post-retiro:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Error enviando email de agradecimiento post-retiro:", e);
    return false;
  }
}
