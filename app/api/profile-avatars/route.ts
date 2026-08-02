import { NextResponse } from "next/server";
import { getProfileAvatars } from "@/lib/profile-avatars-store";

export const dynamic = "force-dynamic";

/** Avatares activos para el selector de perfil (público). */
export async function GET() {
  const avatars = await getProfileAvatars({ activeOnly: true });
  return NextResponse.json(avatars);
}
