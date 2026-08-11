import { handlers } from "@/auth";
import { withAuthRequestHost } from "@/lib/auth-request";
import type { NextRequest } from "next/server";

export const GET = (req: NextRequest) => handlers.GET(withAuthRequestHost(req));
export const POST = (req: NextRequest) => handlers.POST(withAuthRequestHost(req));
