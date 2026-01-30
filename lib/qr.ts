import QRCode from "qrcode";

/**
 * Genera un código único de pickup para un pedido
 * Formato: FADU-YYYY-NNNNN
 */
export function generatePickupCode(orderNumber: number): string {
  const year = new Date().getFullYear();
  const paddedNumber = String(orderNumber).padStart(5, "0");
  return `FADU-${year}-${paddedNumber}`;
}

/**
 * Genera un QR code como Data URL (base64) para embeber en emails/HTML
 */
export async function generateQRDataURL(code: string): Promise<string> {
  try {
    return await QRCode.toDataURL(code, {
      errorCorrectionLevel: "M",
      width: 300,
      margin: 2,
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("No se pudo generar el código QR");
  }
}

/**
 * Genera un QR code como Buffer para guardar como archivo
 */
export async function generateQRBuffer(code: string): Promise<Buffer> {
  try {
    return await QRCode.toBuffer(code, {
      errorCorrectionLevel: "M",
      width: 300,
      margin: 2,
    });
  } catch (error) {
    console.error("Error generating QR buffer:", error);
    throw new Error("No se pudo generar el código QR");
  }
}
