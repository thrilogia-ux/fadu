export type StoredAppliedCoupon = {
  code: string;
  couponId: string;
  type: "percent" | "fixed" | string;
  value: number;
  discount: number;
};

const STORAGE_KEY = "cartCoupon";

export function loadStoredCoupon(): StoredAppliedCoupon | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAppliedCoupon;
    if (!parsed?.code || !parsed?.couponId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredCoupon(coupon: StoredAppliedCoupon | null) {
  if (typeof window === "undefined") return;
  if (!coupon) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupon));
}

export function recomputeStoredCouponDiscount(
  coupon: StoredAppliedCoupon,
  cartTotal: number
): StoredAppliedCoupon {
  let discount = 0;
  if (coupon.type === "percent") {
    discount = (cartTotal * coupon.value) / 100;
  } else {
    discount = coupon.value;
  }
  discount = Math.min(Math.max(0, discount), cartTotal);
  return { ...coupon, discount };
}
