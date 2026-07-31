"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { cartLineKey } from "@/lib/cart-line";
import Link from "next/link";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, total, discount, finalTotal, clearCart, appliedCoupon, setAppliedCoupon, clearCoupon } = useCart();
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"mercadopago" | "transfer" | "test">("mercadopago");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [pickupSchedule, setPickupSchedule] = useState<string[]>([]);
  const [pickupAddress, setPickupAddress] = useState("");
  const [fairMode, setFairMode] = useState({
    enabled: false,
    title: "",
    message: "",
    hideMercadoPago: false,
  });
  const isCompletingOrderRef = useRef(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []));
    fetch("/api/pickup-info")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setPickupSchedule(Array.isArray(data.scheduleLines) ? data.scheduleLines : []);
          setPickupAddress(typeof data.address === "string" ? data.address : "");
        }
      });
    fetch("/api/fair-mode")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.enabled === "boolean") {
          setFairMode(data);
          if (data.enabled && data.hideMercadoPago) {
            setPaymentMethod("transfer");
          }
        }
      });
  }, []);

  useEffect(() => {
    if (appliedCoupon?.code) {
      setCouponCode(appliedCoupon.code);
    }
  }, [appliedCoupon?.code]);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), cartTotal: total }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.error || "Cupón inválido");
        clearCoupon();
      } else {
        setAppliedCoupon({
          code: data.coupon.code,
          couponId: data.coupon.id,
          type: data.coupon.type,
          value: data.coupon.value,
          discount: data.discount,
        });
        setCouponCode(data.coupon.code);
        setCouponError("");
      }
    } catch {
      setCouponError("Error al validar cupón");
    }
    setCouponLoading(false);
  }

  function removeCoupon() {
    clearCoupon();
    setCouponCode("");
    setCouponError("");
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.phone && typeof data.phone === "string") {
          setPhone(data.phone);
        }
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
    if (items.length === 0 && status === "authenticated" && !isCompletingOrderRef.current) {
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
            variantId: item.variantId ?? undefined,
          })),
          paymentMethod,
          phone: phone.trim() || null,
          couponCode: appliedCoupon?.code ?? null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear el pedido");
        setLoading(false);
        return;
      }

      const emailLines: string[] = [];
      if (data.emailConfirmationSent === false) {
        emailLines.push(
          `• Confirmación de compra: no se pudo enviar.\n  ${data.emailConfirmationError || "Revisá Resend: API key, dominio verificado y RESEND_FROM_EMAIL."}`
        );
      }
      if (data.emailPickupSent === false) {
        emailLines.push(
          `• Email con código/QR para retirar: no se pudo enviar.\n  ${data.emailPickupError || ""}`
        );
      }
      if (emailLines.length > 0) {
        window.alert(
          "Pedido creado, pero hay un problema con el correo hacia tu casilla:\n\n" +
            emailLines.join("\n\n") +
            "\n\nSin un dominio verificado en Resend, solo podés enviar al mail de tu cuenta Resend. Revisá también SPAM."
        );
      }

      // Si es Mercado Pago, redirigir a la preferencia
      if (paymentMethod === "mercadopago" && data.initPoint) {
        window.location.href = data.initPoint;
        return;
      }

      // Si es transferencia o pago de prueba, ir a página de confirmación
      isCompletingOrderRef.current = true;
      router.push(`/pedido/${data.orderId}?success=true`);
      clearCart();
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#fafafa]">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[#0f3bff]/25" aria-hidden />
        <p className="text-sm text-gray-600">Cargando checkout…</p>
      </div>
    );
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

          {fairMode.enabled && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <h2 className="font-semibold text-amber-950">{fairMode.title}</h2>
              <p className="mt-1 text-sm text-amber-900">{fairMode.message}</p>
            </div>
          )}

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
                        className="min-h-[44px] w-full rounded-lg border border-black/20 bg-gray-50 px-4 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        WhatsApp / teléfono
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+54 9 11 1234-5678"
                        className="min-h-[48px] w-full rounded-lg border border-black/20 px-4 py-2.5 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                        autoComplete="tel"
                      />
                      <p className="mt-1 text-xs text-gray-600">
                        Para avisarte por email y, si lo cargás, para que el equipo te contacte por
                        WhatsApp cuando el pedido esté listo para retirar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Método de pago */}
                <div className="min-w-0 rounded-lg border border-black/8 bg-white p-4 sm:p-6">
                  <h2 className="mb-4 text-lg font-semibold">Método de pago</h2>
                  <div className="space-y-3">
                    {(!fairMode.enabled || !fairMode.hideMercadoPago) && (
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
                    )}

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
                  <div
                    className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
                    role="alert"
                  >
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
                      <div key={cartLineKey(item)} className="flex min-w-0 justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate text-gray-600">
                          {item.name}
                          {item.variantLabel ? ` (${item.variantLabel})` : ""} x{item.quantity}
                        </span>
                        <span className="font-semibold shrink-0">
                          ${(item.price * item.quantity).toLocaleString("es-AR")}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between gap-2 border-t border-black/8 pt-2 text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold shrink-0">${total.toLocaleString("es-AR")}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between gap-2 text-sm text-green-600">
                        <span>Descuento{appliedCoupon ? ` (${appliedCoupon.code})` : ""}</span>
                        <span className="font-semibold shrink-0">-${discount.toLocaleString("es-AR")}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium">¿Tenés un cupón?</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="CODIGO"
                        className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-black/20 px-3 py-2 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gray-800 px-4 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:bg-gray-300"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
                    {discount > 0 && (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-sm text-green-600">✓ Cupón aplicado</p>
                        <button
                          type="button"
                          onClick={removeCoupon}
                          className="text-sm text-gray-600 hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mb-6 flex justify-between gap-2 text-xl font-bold">
                    <span>Total</span>
                    <span className="shrink-0">${finalTotal.toLocaleString("es-AR")}</span>
                  </div>

                  {(pickupAddress || pickupSchedule.length > 0) && (
                    <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                      <p className="mb-2 font-semibold text-[#1d1d1b]">Retiro en FADU</p>
                      {pickupAddress ? <p className="mb-1">{pickupAddress}</p> : null}
                      {pickupSchedule.length > 0 ? (
                        <ul className="space-y-0.5">
                          {pickupSchedule.map((line) => (
                            <li key={line}>• {line}</li>
                          ))}
                        </ul>
                      ) : null}
                      <Link href="/retiro" className="mt-2 inline-block text-[#0f3bff] hover:underline">
                        Más info
                      </Link>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] rounded-lg bg-[#0f3bff] py-3 font-semibold text-white transition hover:bg-[#0d32cc] active:bg-[#0a28a8] disabled:bg-gray-300"
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
