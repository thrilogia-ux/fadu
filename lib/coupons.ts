import type { Coupon } from "@prisma/client";

export type AppliedCouponInfo = {
  id: string;
  code: string;
  type: string;
  value: number;
};

export type CouponValidationSuccess = {
  ok: true;
  discount: number;
  coupon: AppliedCouponInfo;
};

export type CouponValidationFailure = {
  ok: false;
  error: string;
};

export type CouponValidationResult = CouponValidationSuccess | CouponValidationFailure;

export function calculateCouponDiscount(
  coupon: Pick<Coupon, "type" | "value">,
  cartTotal: number
): number {
  if (cartTotal <= 0) return 0;

  let discount = 0;
  if (coupon.type === "percent") {
    discount = (cartTotal * Number(coupon.value)) / 100;
  } else {
    discount = Number(coupon.value);
  }

  return Math.min(Math.max(0, discount), cartTotal);
}

export function validateCouponForCart(
  coupon: Coupon | null,
  cartTotal: number
): CouponValidationResult {
  if (!coupon || !coupon.active) {
    return { ok: false, error: "Cupón inválido" };
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return { ok: false, error: "Cupón expirado" };
  }

  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: "Cupón agotado" };
  }

  if (coupon.minPurchase != null && cartTotal < Number(coupon.minPurchase)) {
    return {
      ok: false,
      error: `Compra mínima de $${Number(coupon.minPurchase).toLocaleString("es-AR")} requerida`,
    };
  }

  const discount = calculateCouponDiscount(coupon, cartTotal);

  return {
    ok: true,
    discount,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
    },
  };
}
