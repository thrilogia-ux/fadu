"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandIcon } from "@/components/BrandIcon";
import { PickupScheduleDisplay } from "@/components/PickupScheduleDisplay";
import type { PickupInfo } from "@/lib/pickup";
import type { ShippingQuoteResult } from "@/lib/shipping-zones";

export type DeliveryMethod = "pickup" | "shipping";

export type ShippingFormState = {
  recipientName: string;
  street: string;
  streetNumber: string;
  city: string;
  state: string;
  postalCode: string;
  floor: string;
  apartment: string;
  notes: string;
};

type CartItemForQuote = {
  quantity: number;
};

type Props = {
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  shippingEnabled: boolean;
  pickupAddress: string;
  pickupSchedule: string[];
  pickupInfo: PickupInfo | null;
  cartSubtotal: number;
  cartItems: CartItemForQuote[];
  shippingForm: ShippingFormState;
  onShippingFormChange: (patch: Partial<ShippingFormState>) => void;
  onQuoteChange: (quote: ShippingQuoteResult | null) => void;
  disabled?: boolean;
};

const emptyQuote = null;

export function CheckoutDeliverySection({
  deliveryMethod,
  onDeliveryMethodChange,
  shippingEnabled,
  pickupAddress,
  pickupSchedule,
  pickupInfo,
  cartSubtotal,
  cartItems,
  shippingForm,
  onShippingFormChange,
  onQuoteChange,
  disabled = false,
}: Props) {
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quote, setQuote] = useState<ShippingQuoteResult | null>(emptyQuote);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const pickupDisplay: PickupInfo = pickupInfo ?? {
    address: pickupAddress,
    notes: null,
    slots: [],
    scheduleLines: pickupSchedule,
  };

  async function fetchQuote(cp: string, optionId?: string | null) {
    const trimmed = cp.trim();
    if (trimmed.length < 4) {
      setQuote(null);
      onQuoteChange(null);
      setQuoteError("");
      setSelectedOptionId(null);
      return;
    }

    setQuoteLoading(true);
    setQuoteError("");
    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode: trimmed,
          state: shippingForm.state,
          subtotal: cartSubtotal,
          selectedOptionId: optionId ?? selectedOptionId ?? undefined,
          items: cartItems.map((i) => ({ quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuote(null);
        onQuoteChange(null);
        setQuoteError(data.error || "No hay envío para ese CP");
        setSelectedOptionId(null);
        return;
      }
      const result = data as ShippingQuoteResult;
      if (result.ok) {
        setQuote(result);
        setSelectedOptionId(result.selectedOptionId ?? result.zoneId);
        onQuoteChange(result);
      }
    } catch {
      setQuoteError("Error al cotizar envío");
      setQuote(null);
      onQuoteChange(null);
      setSelectedOptionId(null);
    } finally {
      setQuoteLoading(false);
    }
  }

  function selectOption(optionId: string) {
    setSelectedOptionId(optionId);
    void fetchQuote(shippingForm.postalCode, optionId);
  }

  useEffect(() => {
    if (deliveryMethod !== "shipping" || !shippingEnabled) {
      setQuote(null);
      onQuoteChange(null);
      setQuoteError("");
      return;
    }
    const t = setTimeout(() => {
      void fetchQuote(shippingForm.postalCode);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryMethod, shippingForm.postalCode, shippingForm.state, cartSubtotal, shippingEnabled, cartItems.length]);

  return (
    <div className="min-w-0 rounded-lg border border-black/8 bg-white p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">¿Cómo querés recibir tu pedido?</h2>

      <div className="space-y-3">
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition has-[:checked]:border-[#0f3bff] has-[:checked]:bg-[#0f3bff]/5 ${
            disabled ? "cursor-not-allowed opacity-60" : "border-black/10 hover:border-[#0f3bff]/40"
          }`}
        >
          <input
            type="radio"
            name="delivery"
            value="pickup"
            checked={deliveryMethod === "pickup"}
            onChange={() => onDeliveryMethodChange("pickup")}
            disabled={disabled}
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <BrandIcon name="retiroFadu" size={22} className="shrink-0" />
              <span className="font-semibold text-[#1d1d1b]">Retiro en Pickup Point FADU</span>
            </div>
            <p className="mt-1 text-sm text-green-700 font-medium">Sin costo de envío</p>
            <div className="mt-3 rounded-lg bg-gray-50 p-3">
              <PickupScheduleDisplay info={pickupDisplay} showNotes={false} />
            </div>
            <Link href="/retiro" className="mt-2 inline-block text-sm text-[#0f3bff] hover:underline">
              Ver guía de retiro
            </Link>
          </div>
        </label>

        {shippingEnabled && (
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition has-[:checked]:border-[#0f3bff] has-[:checked]:bg-[#0f3bff]/5 ${
              disabled ? "cursor-not-allowed opacity-60" : "border-black/10 hover:border-[#0f3bff]/40"
            }`}
          >
            <input
              type="radio"
              name="delivery"
              value="shipping"
              checked={deliveryMethod === "shipping"}
              onChange={() => onDeliveryMethodChange("shipping")}
              disabled={disabled}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <BrandIcon name="envioDomicilio" size={22} className="shrink-0" />
                <span className="font-semibold text-[#1d1d1b]">Envío a domicilio</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Calculamos el costo según tu código postal
              </p>

              {deliveryMethod === "shipping" && (
                <div className="mt-4 space-y-3 border-t border-black/8 pt-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Código postal *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={shippingForm.postalCode}
                      onChange={(e) => onShippingFormChange({ postalCode: e.target.value })}
                      placeholder="Ej: 1425"
                      className="min-h-[44px] w-full max-w-xs rounded-lg border border-black/20 px-4 py-2.5 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                      autoComplete="postal-code"
                    />
                    {quoteLoading && (
                      <p className="mt-1 text-xs text-gray-500">Calculando envío…</p>
                    )}
                    {quoteError && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {quoteError}
                      </p>
                    )}
                    {quote?.ok && (
                      <div className="mt-2 space-y-2">
                        {quote.options && quote.options.length > 1 ? (
                          quote.options.map((opt) => (
                            <label
                              key={opt.id}
                              className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                                (selectedOptionId ?? quote.zoneId) === opt.id
                                  ? "border-[#0f3bff] bg-[#0f3bff]/5"
                                  : "border-black/10"
                              }`}
                            >
                              <input
                                type="radio"
                                name="shippingOption"
                                checked={(selectedOptionId ?? quote.zoneId) === opt.id}
                                onChange={() => selectOption(opt.id)}
                                className="mt-0.5"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="font-semibold text-[#1d1d1b]">{opt.label}</span>
                                <span className="ml-2 font-semibold">
                                  ${opt.price.toLocaleString("es-AR")}
                                </span>
                                {opt.estimatedDays && (
                                  <p className="text-gray-600">{opt.estimatedDays}</p>
                                )}
                              </span>
                            </label>
                          ))
                        ) : (
                          <div className="rounded-lg bg-[#0f3bff]/5 px-3 py-2 text-sm">
                            <p className="font-semibold text-[#1d1d1b]">
                              {quote.zoneName}:{" "}
                              {quote.freeShippingApplied ? (
                                <span className="text-green-700">Envío gratis</span>
                              ) : (
                                `$${quote.price.toLocaleString("es-AR")}`
                              )}
                            </p>
                            {quote.estimatedDays && (
                              <p className="text-gray-600">{quote.estimatedDays}</p>
                            )}
                            {quote.source === "enviopack" && (
                              <p className="text-xs text-indigo-700">Tarifa logística en tiempo real</p>
                            )}
                          </div>
                        )}
                        {quote.options && quote.options.length > 1 && quote.freeShippingApplied && (
                          <p className="text-sm font-medium text-green-700">Envío gratis aplicado</p>
                        )}
                      </div>
                    )}
                  </div>

                  {quote?.ok && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Nombre y apellido *</label>
                        <input
                          type="text"
                          value={shippingForm.recipientName}
                          onChange={(e) => onShippingFormChange({ recipientName: e.target.value })}
                          className="min-h-[44px] w-full rounded-lg border border-black/20 px-4 py-2.5 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Calle *</label>
                        <input
                          type="text"
                          value={shippingForm.street}
                          onChange={(e) => onShippingFormChange({ street: e.target.value })}
                          className="min-h-[44px] w-full rounded-lg border border-black/20 px-4 py-2.5 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                          autoComplete="address-line1"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium">Número *</label>
                          <input
                            type="text"
                            value={shippingForm.streetNumber}
                            onChange={(e) => onShippingFormChange({ streetNumber: e.target.value })}
                            placeholder="Ej: 350"
                            className="min-h-[44px] w-full rounded-lg border border-black/20 px-4 py-2.5 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Piso</label>
                          <input
                            type="text"
                            value={shippingForm.floor}
                            onChange={(e) => onShippingFormChange({ floor: e.target.value })}
                            className="min-h-[44px] w-full rounded-lg border border-black/20 px-4 py-2.5 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Depto</label>
                          <input
                            type="text"
                            value={shippingForm.apartment}
                            onChange={(e) => onShippingFormChange({ apartment: e.target.value })}
                            className="min-h-[44px] w-full rounded-lg border border-black/20 px-4 py-2.5 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium">Ciudad / localidad *</label>
                          <input
                            type="text"
                            value={shippingForm.city}
                            onChange={(e) => onShippingFormChange({ city: e.target.value })}
                            className="min-h-[44px] w-full rounded-lg border border-black/20 px-4 py-2.5 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                            autoComplete="address-level2"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium">Provincia</label>
                          <input
                            type="text"
                            value={shippingForm.state}
                            onChange={(e) => onShippingFormChange({ state: e.target.value })}
                            placeholder="Buenos Aires"
                            className="min-h-[44px] w-full rounded-lg border border-black/20 px-4 py-2.5 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                            autoComplete="address-level1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Piso, depto, referencias (opcional)
                        </label>
                        <input
                          type="text"
                          value={shippingForm.notes}
                          onChange={(e) => onShippingFormChange({ notes: e.target.value })}
                          className="min-h-[44px] w-full rounded-lg border border-black/20 px-4 py-2.5 text-base outline-none focus:border-[#0f3bff] focus:ring-2 focus:ring-[#0f3bff]/20 sm:text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </label>
        )}
      </div>
    </div>
  );
}
