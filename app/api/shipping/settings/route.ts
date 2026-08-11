import { NextResponse } from "next/server";
import { getShippingSettings } from "@/lib/shipping-zones";

export const dynamic = "force-dynamic";

/** Config pública: solo si envíos están habilitados (sin detalle interno de zonas). */
export async function GET() {
  try {
    const settings = await getShippingSettings();
    const activeZones = settings.zones.filter((z) => z.active);
    const fromPrice =
      activeZones.length > 0 ? Math.min(...activeZones.map((z) => z.price)) : null;

    return NextResponse.json({
      enabled: settings.enabled,
      freeShippingMin: settings.freeShippingMin,
      zoneCount: activeZones.length,
      fromPrice,
    });
  } catch (error) {
    console.error("[shipping/settings]", error);
    return NextResponse.json({ enabled: false, freeShippingMin: null, zoneCount: 0 });
  }
}
