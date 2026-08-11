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
};

export function ProductDeliveryInfo({ pickupInfo }: Props) {
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
    <div className="mb-6 space-y-3">
      <p className="text-sm font-semibold text-gray-700">Formas de entrega</p>

      <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
        <span className="text-2xl" aria-hidden>
          📍
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-green-600">Retiro en FADU (Pickup Point)</p>
          <div className="mt-2">
            <PickupScheduleDisplay info={pickupInfo} showNotes={false} />
          </div>
          <Link
            href="/retiro"
            className="mt-2 inline-block text-sm font-medium text-[#0f3bff] hover:underline"
          >
            Más info sobre el retiro
          </Link>
        </div>
      </div>

      {shipping?.enabled && (
        <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <span className="text-2xl" aria-hidden>
            🚚
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-indigo-700">Envío a domicilio</p>
            <p className="mt-1 text-sm leading-relaxed text-indigo-900">
              Disponible en CABA, GBA y resto del país. El costo se calcula por código postal al
              finalizar la compra.
            </p>
            <p className="mt-2 text-sm text-indigo-800">
              {shipping.fromPrice != null && shipping.fromPrice > 0 && (
                <span className="font-semibold">
                  Desde ${shipping.fromPrice.toLocaleString("es-AR")}
                </span>
              )}
              {shipping.freeShippingMin != null && shipping.freeShippingMin > 0 && (
                <span>
                  {shipping.fromPrice != null && shipping.fromPrice > 0 ? " · " : ""}
                  Envío gratis desde ${shipping.freeShippingMin.toLocaleString("es-AR")}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
