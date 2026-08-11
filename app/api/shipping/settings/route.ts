import { NextResponse } from "next/server";
import { getShippingSettings } from "@/lib/shipping-zones";

export const dynamic = "force-dynamic";

/** Config pública: solo si envíos están habilitados (sin detalle interno de zonas). */
export async function GET() {
  try {
    const settings = await getShippingSettings();
    return NextResponse.json({
      enabled: settings.enabled,
      freeShippingMin: settings.freeShippingMin,
      zoneCount: settings.zones.filter((z) => z.active).length,
    });
  } catch (error) {
    console.error("[shipping/settings]", error);
    return NextResponse.json({ enabled: false, freeShippingMin: null, zoneCount: 0 });
  }
}
