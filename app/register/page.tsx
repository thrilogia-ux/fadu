"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Error al crear la cuenta");
        setLoading(false);
        return;
      }
      setDone(true);
      // Iniciar sesión automáticamente
      const signInRes = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: "/",
      });
      if (signInRes?.url) window.location.href = signInRes.url;
      else window.location.href = "/";
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-[#1d1d1b]/70">Cuenta creada. Redirigiendo…</p>
      </div>
    );
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
          <h1 className="text-xl font-semibold text-[#1d1d1b] mb-6">Crear cuenta</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#1d1d1b]/80 mb-1.5">
                Nombre (opcional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20"
                placeholder="Tu nombre"
              />
            </div>
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
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0f3bff] py-3 text-[15px] font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#1d1d1b]/60">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="font-medium text-[#0f3bff] hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
