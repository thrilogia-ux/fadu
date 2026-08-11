"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PickupScheduleDisplay } from "@/components/PickupScheduleDisplay";
import type { PickupInfo } from "@/lib/pickup";

type ShippingPublicInfo = {
  enabled: boolean;
  freeShippingMin: number | null;
  fromPrice: number | null;
};

type Props = {
  pickupInfo: PickupInfo;
  compact?: boolean;
};

export function ProductDeliveryInfo({ pickupInfo, compact = false }: Props) {
  const [shipping, setShipping] = useState<ShippingPublicInfo | null>(null);

  useEffect(() => {
    fetch("/api/shipping/settings")
      .then((r) => r.json())
      .then((data) => {
        setShipping({
          enabled: Boolean(data.enabled),
          freeShippingMin:
            data.freeShippingMin != null && data.freeShippingMin !== ""
              ? Number(data.freeShippingMin)
              : null,
          fromPrice:
            data.fromPrice != null && Number.isFinite(Number(data.fromPrice))
              ? Number(data.fromPrice)
              : null,
        });
      })
      .catch(() => setShipping({ enabled: false, freeShippingMin: null, fromPrice: null }));
  }, []);

  return (
    <div className={`space-y-3 ${compact ? "mb-4" : "mb-6"}`}>
      <p className={`font-semibold text-gray-700 ${compact ? "text-xs" : "text-sm"}`}>
        Formas de entrega
      </p>

      <div
        className={`flex items-start gap-2.5 rounded-lg bg-gray-50 ${compact ? "p-3" : "gap-3 p-4"}`}
      >
        <span className={compact ? "text-lg" : "text-2xl"} aria-hidden>
          📍
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-green-600 ${compact ? "text-sm" : ""}`}>
            Retiro en FADU
          </p>
          <div className={`${compact ? "mt-1 text-sm" : "mt-2"}`}>
            <PickupScheduleDisplay info={pickupInfo} showNotes={false} />
          </div>
          {!compact && (
            <Link
              href="/retiro"
              className="mt-2 inline-block text-sm font-medium text-[#0f3bff] hover:underline"
            >
              Más info sobre el retiro
            </Link>
          )}
        </div>
      </div>

      {shipping?.enabled && (
        <div
          className={`flex items-start gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50 ${compact ? "p-3" : "gap-3 p-4"}`}
        >
          <span className={compact ? "text-lg" : "text-2xl"} aria-hidden>
            🚚
          </span>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-indigo-700 ${compact ? "text-sm" : ""}`}>
              Envío a domicilio
            </p>
            <p
              className={`leading-relaxed text-indigo-900 ${compact ? "mt-0.5 text-xs" : "mt-1 text-sm"}`}
            >
              CABA, GBA y resto del país. Costo por CP en el checkout.
            </p>
            {(shipping.fromPrice != null && shipping.fromPrice > 0) ||
            (shipping.freeShippingMin != null && shipping.freeShippingMin > 0) ? (
              <p className={`text-indigo-800 ${compact ? "mt-1 text-xs" : "mt-2 text-sm"}`}>
                {shipping.fromPrice != null && shipping.fromPrice > 0 && (
                  <span className="font-semibold">
                    Desde ${shipping.fromPrice.toLocaleString("es-AR")}
                  </span>
                )}
                {shipping.freeShippingMin != null && shipping.freeShippingMin > 0 && (
                  <span>
                    {shipping.fromPrice != null && shipping.fromPrice > 0 ? " · " : ""}
                    Gratis desde ${shipping.freeShippingMin.toLocaleString("es-AR")}
                  </span>
                )}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
