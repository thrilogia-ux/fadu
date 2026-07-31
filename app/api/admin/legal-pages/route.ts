import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAllLegalPages,
  upsertLegalPages,
  LEGAL_PAGE_META,
  LEGAL_PAGE_IDS,
  isLegalPageId,
  type LegalPageId,
} from "@/lib/legal-pages";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pages = await getAllLegalPages();
  const list = LEGAL_PAGE_IDS.map((id) => ({
    id,
    path: LEGAL_PAGE_META[id].path,
    description: LEGAL_PAGE_META[id].description,
    title: pages[id].title,
    content: pages[id].content,
  }));

  return NextResponse.json(list);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Partial<Record<LegalPageId, { title: string; content: string }>> = {};

  if (body?.pages && Array.isArray(body.pages)) {
    for (const item of body.pages) {
      if (!item || typeof item.id !== "string" || !isLegalPageId(item.id)) continue;
      const pageId: LegalPageId = item.id;
      updates[pageId] = {
        title: typeof item.title === "string" ? item.title.trim().slice(0, 200) : "",
        content: typeof item.content === "string" ? item.content.trim().slice(0, 20000) : "",
      };
    }
  } else if (body?.id && isLegalPageId(body.id)) {
    const pageId: LegalPageId = body.id;
    updates[pageId] = {
      title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : "",
      content: typeof body.content === "string" ? body.content.trim().slice(0, 20000) : "",
    };
  } else {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const saved = await upsertLegalPages(updates);
  const list = LEGAL_PAGE_IDS.map((id) => ({
    id,
    path: LEGAL_PAGE_META[id].path,
    description: LEGAL_PAGE_META[id].description,
    title: saved[id].title,
    content: saved[id].content,
  }));

  return NextResponse.json(list);
}
