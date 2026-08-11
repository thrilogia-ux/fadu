import { NextResponse } from "next/server";
import { getShippingSettings, quoteShipping } from "@/lib/shipping-zones";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postalCode = searchParams.get("postalCode") ?? searchParams.get("cp") ?? "";
  const subtotalRaw = searchParams.get("subtotal");

  if (!postalCode.trim()) {
    return NextResponse.json({ error: "Falta el código postal" }, { status: 400 });
  }

  const subtotal = subtotalRaw != null ? Number(subtotalRaw) : 0;
  const cartSubtotal = Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : 0;

  try {
    const settings = await getShippingSettings();
    const quote = quoteShipping(postalCode, settings, cartSubtotal);

    if (!quote.ok) {
      return NextResponse.json({ error: quote.error }, { status: 400 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("[shipping/quote]", error);
    return NextResponse.json({ error: "Error al cotizar envío" }, { status: 500 });
  }
}
