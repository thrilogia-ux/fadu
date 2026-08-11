import { handlers } from "@/auth";
import { withAuthRequestHost } from "@/lib/auth-request";
import { prepareAuthRuntimeEnv } from "@/lib/auth-runtime-env";
import type { NextRequest } from "next/server";

function handleAuth(req: NextRequest) {
  prepareAuthRuntimeEnv();
  return withAuthRequestHost(req);
}

export const GET = (req: NextRequest) => handlers.GET(handleAuth(req));
export const POST = (req: NextRequest) => handlers.POST(handleAuth(req));
