import Link from "next/link";
import { Suspense } from "react";
import { GoogleSignInForm } from "@/components/GoogleSignInForm";
import { authErrorMessage } from "@/lib/auth-errors";
import { LoginCredentialsForm, LoginShell } from "./LoginCredentialsForm";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/";
  const oauthError = authErrorMessage(params.error ?? null);

  return (
    <LoginShell>
      <h1 className="text-xl font-semibold text-[#1d1d1b] mb-6">Iniciar sesión</h1>

      {oauthError ? (
        <p
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {oauthError}
        </p>
      ) : null}

      <Suspense
        fallback={
          <div className="flex min-h-[48px] items-center justify-center rounded-xl border border-black/12 bg-white">
            <span className="text-sm text-[#1d1d1b]/50">Cargando Google…</span>
          </div>
        }
      >
        <GoogleSignInForm callbackUrl={callbackUrl} />
      </Suspense>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-black/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-[#1d1d1b]/50">o con email</span>
        </div>
      </div>

      <LoginCredentialsForm callbackUrl={callbackUrl} />

      <p className="mt-6 text-center text-sm text-[#1d1d1b]/60">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-medium text-[#0f3bff] hover:underline">
          Registrarse
        </Link>
      </p>
    </LoginShell>
  );
}
