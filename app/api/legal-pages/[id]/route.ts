import { NextResponse } from "next/server";
import { getLegalPage, isLegalPageId } from "@/lib/legal-pages";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isLegalPageId(id)) {
      return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
    }
    const page = await getLegalPage(id);
    return NextResponse.json({
      id: page.id,
      title: page.title,
      content: page.content,
      path: page.path,
    });
  } catch (error) {
    console.error("Error fetching legal page:", error);
    return NextResponse.json({ error: "Error al obtener página" }, { status: 500 });
  }
}
