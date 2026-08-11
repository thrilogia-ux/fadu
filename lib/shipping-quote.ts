import { isEnviopackConfigured, quoteEnviopackHomeDelivery } from "@/lib/enviopack";
import {
  estimateShippingFromCart,
  type CartLineForShipping,
} from "@/lib/shipping-packages";
import {
  getShippingSettings,
  normalizePostalCode,
  quoteShipping,
  type ShippingQuoteResult,
  type ShippingSettings,
} from "@/lib/shipping-zones";

function applyFreeShipping(
  price: number,
  settings: ShippingSettings,
  cartSubtotalAfterDiscount: number
): { price: number; freeShippingApplied: boolean } {
  const freeShippingApplied =
    settings.freeShippingMin != null && cartSubtotalAfterDiscount >= settings.freeShippingMin;
  return { price: freeShippingApplied ? 0 : price, freeShippingApplied };
}

export async function quoteShippingForCheckout(input: {
  postalCode: string;
  state?: string;
  cartSubtotalAfterDiscount: number;
  cartLines?: CartLineForShipping[];
  selectedOptionId?: string;
}): Promise<ShippingQuoteResult> {
  const settings = await getShippingSettings();

  if (!settings.enabled) {
    return { ok: false, error: "Los envíos no están habilitados en este momento." };
  }

  const normalizedCp = normalizePostalCode(input.postalCode);
  if (normalizedCp.length < 4) {
    return { ok: false, error: "Ingresá un código postal válido (mínimo 4 caracteres)." };
  }

  const packageSummary = estimateShippingFromCart(input.cartLines ?? [{ quantity: 1 }]);
  const useEnviopack =
    settings.provider === "enviopack" && isEnviopackConfigured();

  if (useEnviopack) {
    try {
      const options = await quoteEnviopackHomeDelivery({
        postalCode: normalizedCp,
        state: input.state ?? "",
        packageSummary,
        direccionEnvioId: settings.enviopackDireccionEnvioId,
      });

      if (options.length > 0) {
        const selected =
          (input.selectedOptionId
            ? options.find((o) => o.id === input.selectedOptionId)
            : null) ?? options[0];

        const { price, freeShippingApplied } = applyFreeShipping(
          selected.price,
          settings,
          input.cartSubtotalAfterDiscount
        );

        return {
          ok: true,
          source: "enviopack",
          zoneId: selected.id,
          zoneName: selected.label,
          price,
          originalPrice: selected.price,
          freeShippingApplied,
          estimatedDays: selected.estimatedDays,
          postalCode: normalizedCp,
          options: options.map((o) => ({
            id: o.id,
            label: o.label,
            price: o.price,
            estimatedDays: o.estimatedDays,
            servicio: o.servicio,
            modalidad: o.modalidad,
          })),
          selectedOptionId: selected.id,
          servicio: selected.servicio,
          modalidad: selected.modalidad,
        };
      }

      if (!settings.enviopackFallbackToZones) {
        return {
          ok: false,
          error: "No hay envíos disponibles para ese código postal en este momento.",
        };
      }
    } catch (e) {
      console.error("[shipping-quote] enviopack:", e);
      if (!settings.enviopackFallbackToZones) {
        return {
          ok: false,
          error: "No pudimos cotizar el envío. Probá de nuevo en unos minutos.",
        };
      }
    }
  }

  return quoteShipping(normalizedCp, settings, input.cartSubtotalAfterDiscount);
}

/** Re-cotiza y valida la opción elegida al crear el pedido. */
export async function validateShippingQuoteForOrder(input: {
  postalCode: string;
  state?: string;
  cartSubtotalAfterDiscount: number;
  cartLines?: CartLineForShipping[];
  expectedPrice: number;
  zoneId?: string | null;
  servicio?: string | null;
  modalidad?: string | null;
}): Promise<ShippingQuoteResult> {
  const quote = await quoteShippingForCheckout({
    postalCode: input.postalCode,
    state: input.state,
    cartSubtotalAfterDiscount: input.cartSubtotalAfterDiscount,
    cartLines: input.cartLines,
    selectedOptionId: input.zoneId ?? undefined,
  });

  if (!quote.ok) return quote;

  if (quote.price !== input.expectedPrice) {
    return { ok: false, error: "El costo de envío cambió. Actualizá el checkout e intentá de nuevo." };
  }

  if (input.servicio && quote.servicio && quote.servicio !== input.servicio) {
    return { ok: false, error: "La opción de envío ya no está disponible." };
  }

  return quote;
}
