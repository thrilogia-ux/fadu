import { NextResponse } from "next/server";
import { getPickupInfo } from "@/lib/pickup";

export async function GET() {
  try {
    const info = await getPickupInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error("Error fetching pickup info:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
