import { NextResponse } from "next/server";
import { quoteShippingForCheckout } from "@/lib/shipping-quote";
import type { CartLineForShipping } from "@/lib/shipping-packages";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postalCode = searchParams.get("postalCode") ?? searchParams.get("cp") ?? "";
  const subtotalRaw = searchParams.get("subtotal");
  const state = searchParams.get("state") ?? "";
  const selectedOptionId = searchParams.get("optionId") ?? undefined;

  if (!postalCode.trim()) {
    return NextResponse.json({ error: "Falta el código postal" }, { status: 400 });
  }

  const subtotal = subtotalRaw != null ? Number(subtotalRaw) : 0;
  const cartSubtotal = Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : 0;

  try {
    const quote = await quoteShippingForCheckout({
      postalCode,
      state,
      cartSubtotalAfterDiscount: cartSubtotal,
      selectedOptionId,
    });

    if (!quote.ok) {
      return NextResponse.json({ error: quote.error }, { status: 400 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("[shipping/quote]", error);
    return NextResponse.json({ error: "Error al cotizar envío" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const postalCode = typeof body.postalCode === "string" ? body.postalCode : "";
    const state = typeof body.state === "string" ? body.state : "";
    const subtotal = Number(body.subtotal);
    const selectedOptionId =
      typeof body.selectedOptionId === "string" ? body.selectedOptionId : undefined;

    if (!postalCode.trim()) {
      return NextResponse.json({ error: "Falta el código postal" }, { status: 400 });
    }

    const cartLines: CartLineForShipping[] = Array.isArray(body.items)
      ? body.items.map((i: Record<string, unknown>) => ({
          quantity: Math.max(1, Number(i.quantity) || 1),
          weightKg: i.weightKg != null ? Number(i.weightKg) : null,
          heightCm: i.heightCm != null ? Number(i.heightCm) : null,
          widthCm: i.widthCm != null ? Number(i.widthCm) : null,
          depthCm: i.depthCm != null ? Number(i.depthCm) : null,
        }))
      : [{ quantity: 1 }];

    const quote = await quoteShippingForCheckout({
      postalCode,
      state,
      cartSubtotalAfterDiscount: Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : 0,
      cartLines,
      selectedOptionId,
    });

    if (!quote.ok) {
      return NextResponse.json({ error: quote.error }, { status: 400 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("[shipping/quote POST]", error);
    return NextResponse.json({ error: "Error al cotizar envío" }, { status: 500 });
  }
}
