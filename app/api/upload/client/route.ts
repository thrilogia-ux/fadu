import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const LOGO_ALLOWED_TYPES = [...ALLOWED_TYPES, "image/svg+xml"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      {
        error:
          "Vercel Blob no está configurado. En Vercel → Storage → conectá el Blob store al proyecto (variable BLOB_READ_WRITE_TOKEN).",
      },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const isLogoUpload = url.searchParams.get("kind") === "logo";
  const allowedContentTypes = isLogoUpload ? LOGO_ALLOWED_TYPES : ALLOWED_TYPES;

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes,
        maximumSizeInBytes: MAX_SIZE,
        addRandomSuffix: false,
      }),
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Client upload error:", error);
    const message =
      error instanceof Error ? error.message : "Error al subir la imagen";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
