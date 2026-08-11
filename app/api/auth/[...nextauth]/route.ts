import { handlers } from "@/auth";
import { withAuthRequestHost } from "@/lib/auth-request";
import { prepareAuthRuntimeEnv } from "@/lib/auth-runtime-env";
import { ensureUserSchema } from "@/lib/user-schema";
import type { NextRequest } from "next/server";

async function handleAuth(req: NextRequest) {
  prepareAuthRuntimeEnv();
  await ensureUserSchema();
  return withAuthRequestHost(req);
}

export const GET = async (req: NextRequest) => handlers.GET(await handleAuth(req));
export const POST = async (req: NextRequest) => handlers.POST(await handleAuth(req));
