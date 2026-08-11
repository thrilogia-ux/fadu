import { NextRequest } from "next/server";
import { getCanonicalAuthHost } from "@/lib/auth-cookies";

/**
 * En Vercel, req.url suele ser *.vercel.app aunque el usuario entre por el dominio custom.
 * Auth.js valida callbackUrl contra req.url.origin → error Configuration.
 */
export function withAuthRequestHost(req: NextRequest): NextRequest {
  const host = getCanonicalAuthHost(
    req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  );

  const protoHeader = req.headers.get("x-forwarded-proto") ?? "https";
  const protocol = protoHeader.endsWith(":") ? protoHeader : `${protoHeader}:`;

  const current = new URL(req.url);
  if (current.host === host) return req;

  const fixed = new URL(req.url);
  fixed.protocol = protocol;
  fixed.host = host;
  return new NextRequest(fixed, req);
}
