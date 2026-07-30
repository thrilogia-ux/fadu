import { upload } from "@vercel/blob/client";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function safeFolder(folder: string) {
  return folder.replace(/[^a-z0-9-_]/gi, "") || "uploads";
}

function buildPathname(file: File, folder: string) {
  const ext = file.name.split(".").pop() || "jpg";
  return `${safeFolder(folder)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/** Sube imagen desde el navegador a Vercel Blob (evita límite 4.5MB del body en serverless). */
export async function uploadAdminImage(file: File, folder = "uploads") {
  if (file.size > MAX_SIZE) {
    throw new Error("El archivo no puede superar 5MB");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Solo se permiten imágenes (JPEG, PNG, WebP, GIF)");
  }

  const pathname = buildPathname(file, folder);
  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/upload/client",
  });

  return blob.url;
}
