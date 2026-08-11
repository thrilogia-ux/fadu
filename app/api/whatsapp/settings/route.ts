import { NextResponse } from "next/server";
import { getWhatsAppSettings } from "@/lib/whatsapp-settings";

export const dynamic = "force-dynamic";

/** Config pública del botón flotante (sin secretos). */
export async function GET() {
  try {
    const settings = await getWhatsAppSettings();
    return NextResponse.json({
      enabled: settings.floatingEnabled,
      phone: settings.phone,
      greeting: settings.floatingGreeting,
    });
  } catch (error) {
    console.error("[whatsapp/settings]", error);
    return NextResponse.json({ enabled: false, phone: "", greeting: "" });
  }
}
