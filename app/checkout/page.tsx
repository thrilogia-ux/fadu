"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import Link from "next/link";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"mercadopago" | "transfer" | "test">("mercadopago");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
    if (items.length === 0 && status === "authenticated") {
      router.push("/");
    }
  }, [status, items, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          paymentMethod,
          phone: phone.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear el pedido");
        setLoading(false);
        return;
      }

      // Si es Mercado Pago, redirigir a la preferencia
      if (paymentMethod === "mercadopago" && data.initPoint) {
        window.location.href = data.initPoint;
        return;
      }

      // Si es transferencia o pago de prueba, ir a página de confirmación
      clearCart();
      router.push(`/pedido/${data.orderId}?success=true`);
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session || items.length === 0) {
    return null;
  }

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen overflow-x-hidden bg-gray-50 py-6 pb-12 md:py-8">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <h1 className="mb-6 text-2xl font-bold text-[#1d1d1b] text-center md:mb-8 md:text-left md:text-3xl">Finalizar compra</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid min-w-0 gap-8 lg:grid-cols-3">
              {/* Datos y pago */}
              <div className="min-w-0 space-y-6 lg:col-span-2">
                {/* Datos de contacto */}
                <div className="min-w-0 rounded-lg border border-black/8 bg-white p-4 sm:p-6">
                  <h2 className="mb-4 text-lg font-semibold">Datos de contacto</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Email</label>
                      <input
                        type="email"
                        value={session.user.email || ""}
                        disabled
                        className="w-full rounded-lg border border-black/20 bg-gray-50 px-4 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Teléfono (opcional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+54 9 11 1234-5678"
                        className="w-full rounded-lg border border-black/20 px-4 py-2.5 text-sm outline-none focus:border-[#0f3bff]"
                      />
                      <p className="mt-1 text-xs text-gray-600">
                        Te avisaremos por email cuando tu pedido esté listo para retirar en FADU
                      </p>
                    </div>
                  </div>
                </div>

                {/* Método de pago */}
                <div className="min-w-0 rounded-lg border border-black/8 bg-white p-4 sm:p-6">
                  <h2 className="mb-4 text-lg font-semibold">Método de pago</h2>
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-black/10 p-4 transition hover:border-[#0f3bff] has-[:checked]:border-[#0f3bff] has-[:checked]:bg-[#0f3bff]/5">
                      <input
                        type="radio"
                        name="payment"
                        value="mercadopago"
                        checked={paymentMethod === "mercadopago"}
                        onChange={() => setPaymentMethod("mercadopago")}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Mercado Pago</span>
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Tarjetas de crédito, débito, efectivo y más
                        </p>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-black/10 p-4 transition hover:border-[#0f3bff] has-[:checked]:border-[#0f3bff] has-[:checked]:bg-[#0f3bff]/5">
                      <input
                        type="radio"
                        name="payment"
                        value="transfer"
                        checked={paymentMethod === "transfer"}
                        onChange={() => setPaymentMethod("transfer")}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <span className="font-semibold">Transferencia bancaria</span>
                        <p className="text-sm text-gray-600">
                          Te enviaremos los datos por email
                        </p>
                      </div>
                    </label>

                    {(session.user as { role?: string })?.role === "admin" && (
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-dashed border-amber-500/60 bg-amber-50/50 p-4 transition hover:border-amber-500 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-100/50">
                        <input
                          type="radio"
                          name="payment"
                          value="test"
                          checked={paymentMethod === "test"}
                          onChange={() => setPaymentMethod("test")}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Pago de prueba</span>
                            <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              Solo admin
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Simula la compra completa: pedido, emails, QR y seguimiento
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                  </div>
                )}
              </div>

              {/* Resumen */}
              <div className="min-w-0">
                <div className="rounded-lg border border-black/8 bg-white p-4 pb-8 sm:p-6 lg:sticky lg:top-24">
                  <h2 className="mb-4 text-center text-lg font-semibold md:text-left">Resumen</h2>

                  <div className="mb-4 space-y-2 border-b border-black/8 pb-4">
                    {items.map((item) => (
                      <div key={item.productId} className="flex min-w-0 justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate text-gray-600">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="font-semibold shrink-0">
                          ${(item.price * item.quantity).toLocaleString("es-AR")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6 flex justify-between gap-2 text-xl font-bold">
                    <span>Total</span>
                    <span className="shrink-0">${total.toLocaleString("es-AR")}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-[#0f3bff] py-3 font-semibold text-white hover:bg-[#0d32cc] disabled:bg-gray-300"
                  >
                    {loading
                      ? "Procesando..."
                      : paymentMethod === "mercadopago"
                        ? "Ir a pagar"
                        : paymentMethod === "test"
                          ? "Simular compra completa"
                          : "Confirmar pedido"}
                  </button>

                  <Link
                    href="/carrito"
                    className="mt-3 block text-center text-sm text-gray-600 hover:underline"
                  >
                    Volver al carrito
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
