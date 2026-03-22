import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Público: mensajes activos para la marquesina del header */
export async function GET() {
  try {
    const rows = await prisma.topBannerMessage.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, text: true },
    });

    return NextResponse.json(
      { messages: rows },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching top banner messages:", error);
    // Sitio usable sin tabla (p. ej. antes de migrar): el cliente usa fallback
    return NextResponse.json(
      { messages: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30",
        },
      }
    );
  }
}
