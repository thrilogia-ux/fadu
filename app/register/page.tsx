import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { GoogleSignInForm } from "@/components/GoogleSignInForm";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/ubafadushop-logo.svg"
              alt=".UBAfadu.shop"
              width={300}
              height={92}
              unoptimized
              className="h-12 w-auto md:h-14"
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[360px]">
          <h1 className="text-xl font-semibold text-[#1d1d1b] mb-6">Crear cuenta</h1>

          <Suspense
            fallback={
              <div className="flex min-h-[48px] items-center justify-center rounded-xl border border-black/12 bg-white">
                <span className="text-sm text-[#1d1d1b]/50">Cargando Google…</span>
              </div>
            }
          >
            <GoogleSignInForm callbackUrl="/" label="Registrarse con Google" />
          </Suspense>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-black/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-[#1d1d1b]/50">o con email</span>
            </div>
          </div>

          <RegisterForm />
        </div>
      </main>
    </div>
  );
}
