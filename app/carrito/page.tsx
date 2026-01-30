"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import Image from "next/image";
import Link from "next/link";

export default function CarritoPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setLoading(true);
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
        setDiscount(0);
      } else {
        setDiscount(data.discount);
        setCouponError("");
      }
    } catch {
      setCouponError("Error al validar cupón");
    }
    setLoading(false);
  }

  const finalTotal = total - discount;

  return (
    <>
      <Header categories={categories} />

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-8 text-3xl font-bold text-[#1d1d1b]">Carrito de compras</h1>

          {items.length === 0 ? (
            <div className="rounded-lg border border-black/8 bg-white p-12 text-center">
              <p className="mb-4 text-gray-600">Tu carrito está vacío</p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-[#0f3bff] px-6 py-3 font-semibold text-white hover:bg-[#0d32cc]"
              >
                Ver productos
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Productos */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-4 rounded-lg border border-black/8 bg-white p-4"
                  >
                    {item.image && (
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link
                          href={`/producto/${item.slug}`}
                          className="font-semibold text-[#1d1d1b] hover:underline"
                        >
                          {item.name}
                        </Link>
                        <p className="text-lg font-bold text-[#1d1d1b]">
                          ${item.price.toLocaleString("es-AR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/20 hover:bg-black/5"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/20 hover:bg-black/5"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        ${(item.price * item.quantity).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen */}
              <div>
                <div className="sticky top-24 rounded-lg border border-black/8 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold">Resumen del pedido</h2>

                  <div className="mb-4 space-y-2 border-b border-black/8 pb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">${total.toLocaleString("es-AR")}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento</span>
                        <span className="font-semibold">-${discount.toLocaleString("es-AR")}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-6 flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>${finalTotal.toLocaleString("es-AR")}</span>
                  </div>

                  {/* Cupón */}
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">¿Tenés un cupón?</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="CODIGO"
                        className="flex-1 rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#0f3bff]"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={loading || !couponCode.trim()}
                        className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:bg-gray-300"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
                    {discount > 0 && (
                      <p className="mt-2 text-sm text-green-600">✓ Cupón aplicado</p>
                    )}
                  </div>

                  <button
                    onClick={() => router.push("/checkout")}
                    className="w-full rounded-lg bg-[#0f3bff] py-3 font-semibold text-white hover:bg-[#0d32cc]"
                  >
                    Ir al checkout
                  </button>

                  <button
                    onClick={clearCart}
                    className="mt-2 w-full text-sm text-gray-600 hover:underline"
                  >
                    Vaciar carrito
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
