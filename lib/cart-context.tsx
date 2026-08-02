"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { cartLineKey } from "@/lib/cart-line";
import { showAddedToCartToast } from "@/lib/toast";
import {
  loadStoredCoupon,
  recomputeStoredCouponDiscount,
  saveStoredCoupon,
  type StoredAppliedCoupon,
} from "@/lib/cart-coupon";

export interface CartItem {
  productId: string;
  variantId?: string | null;
  /** Texto "Talle M · Negro" para el usuario */
  variantLabel?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug: string;
}

export type { StoredAppliedCoupon as AppliedCoupon };

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem, options?: { silent?: boolean }) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: StoredAppliedCoupon | null;
  setAppliedCoupon: (coupon: StoredAppliedCoupon | null) => void;
  clearCoupon: () => void;
  itemCount: number;
  total: number;
  discount: number;
  finalTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function normalizeItems(parsed: unknown): CartItem[] {
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((x) => x && typeof x === "object" && typeof (x as CartItem).productId === "string")
    .map((x) => {
      const o = x as Record<string, unknown>;
      return {
        productId: String(o.productId),
        variantId: (o.variantId as string | null | undefined) ?? null,
        variantLabel: typeof o.variantLabel === "string" ? o.variantLabel : undefined,
        name: String(o.name ?? ""),
        price: Number(o.price) || 0,
        quantity: Math.max(1, Math.floor(Number(o.quantity) || 1)),
        image: typeof o.image === "string" ? o.image : undefined,
        slug: String(o.slug ?? ""),
      };
    });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCouponState] = useState<StoredAppliedCoupon | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;

    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(normalizeItems(JSON.parse(savedCart)));
      } catch {
        setItems([]);
      }
    }
    setAppliedCouponState(loadStoredCoupon());
    setLoaded(true);
  }, [session, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, loaded]);

  function addItem(item: CartItem, options?: { silent?: boolean }) {
    const key = cartLineKey(item);
    setItems((prev) => {
      const existing = prev.find((i) => cartLineKey(i) === key);
      if (existing) {
        return prev.map((i) =>
          cartLineKey(i) === key ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
    if (!options?.silent) {
      showAddedToCartToast(item.name);
    }
  }

  function removeItem(lineKey: string) {
    setItems((prev) => prev.filter((i) => cartLineKey(i) !== lineKey));
  }

  function updateQuantity(lineKey: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(lineKey);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (cartLineKey(i) === lineKey ? { ...i, quantity } : i))
    );
  }

  function clearCart() {
    setItems([]);
    setAppliedCouponState(null);
    saveStoredCoupon(null);
  }

  function setAppliedCoupon(coupon: StoredAppliedCoupon | null) {
    setAppliedCouponState(coupon);
    saveStoredCoupon(coupon);
  }

  function clearCoupon() {
    setAppliedCouponState(null);
    saveStoredCoupon(null);
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (!loaded || !appliedCoupon) return;
    const recomputed = recomputeStoredCouponDiscount(appliedCoupon, total);
    if (Math.round(recomputed.discount) !== Math.round(appliedCoupon.discount)) {
      setAppliedCouponState(recomputed);
      saveStoredCoupon(recomputed);
    }
  }, [total, loaded, appliedCoupon?.code, appliedCoupon?.type, appliedCoupon?.value]);

  const discount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, total - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        appliedCoupon,
        setAppliedCoupon,
        clearCoupon,
        itemCount,
        total,
        discount,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
