import { NextResponse } from "next/server";
import { getFairModeSettings } from "@/lib/fair-mode";

export async function GET() {
  const settings = await getFairModeSettings();
  return NextResponse.json(settings);
}
