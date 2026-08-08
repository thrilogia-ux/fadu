import { NextResponse } from "next/server";
import { getStoreLogoSettings } from "@/lib/store-logo";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getStoreLogoSettings();
  return NextResponse.json(settings);
}
