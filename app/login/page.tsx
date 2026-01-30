"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Email o contraseña incorrectos");
        setLoading(false);
        return;
      }
      if (res?.url) window.location.href = res.url;
    } catch {
      setError("Error al iniciar sesión");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link href="/" className="flex items-center">
            <Image src="/fadustore.svg" alt="Fadu.store" width={120} height={24} className="h-6 w-auto" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[360px]">
          <h1 className="text-xl font-semibold text-[#1d1d1b] mb-6">Iniciar sesión</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1d1d1b]/80 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1d1d1b]/80 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0f3bff] py-3 text-[15px] font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#1d1d1b]/60">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="font-medium text-[#0f3bff] hover:underline">
              Registrarse
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
