"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type Props = {
  productId: string;
  variantId?: string;
  className?: string;
};

export function WaitlistButton({ productId, variantId, className = "" }: Props) {
  const { data: session } = useSession();
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId: variantId || null, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "No se pudo registrar");
        return;
      }
      setStatus("done");
      setMessage("¡Listo! Te avisamos cuando vuelva el stock.");
    } catch {
      setStatus("error");
      setMessage("Error de conexión");
    }
  }

  if (status === "done") {
    return (
      <p className={`rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 ${className}`}>
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={`space-y-2 ${className}`}>
      <p className="text-sm font-medium text-gray-800">Avisame cuando haya stock</p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full min-h-[44px] rounded-lg border border-[#0f3bff] bg-white px-4 py-2 text-sm font-semibold text-[#0f3bff] hover:bg-[#0f3bff]/5 disabled:opacity-50"
      >
        {status === "loading" ? "Guardando…" : "Unirme a la lista de espera"}
      </button>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </form>
  );
}
