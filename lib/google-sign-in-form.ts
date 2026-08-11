import { cookies, headers } from "next/headers";
import { getCanonicalAuthHost } from "@/lib/auth-cookies";

export async function getGoogleSignInFormProps(callbackUrl: string) {
  const headersList = await headers();
  const host = getCanonicalAuthHost(
    headersList.get("x-forwarded-host") ?? headersList.get("host")
  );
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const csrfRes = await fetch(`${base}/api/auth/csrf`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (!csrfRes.ok) {
    throw new Error("No se pudo obtener CSRF para Google OAuth");
  }

  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const resolvedCallback = callbackUrl.startsWith("http")
    ? callbackUrl
    : `${base}${callbackUrl.startsWith("/") ? callbackUrl : `/${callbackUrl}`}`;

  return {
    action: `${base}/api/auth/signin/google`,
    csrfToken,
    callbackUrl: resolvedCallback,
  };
}
