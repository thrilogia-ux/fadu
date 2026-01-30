"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Cargar carrito desde localStorage al montar (invitado) o desde API (logueado)
  useEffect(() => {
    if (loaded) return;
    
    if (session?.user) {
      // TODO: Cargar desde API /api/cart
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          setItems(parsed);
          // TODO: Sincronizar con backend
        } catch {}
      }
    } else {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch {}
      }
    }
    setLoaded(true);
  }, [session, loaded]);

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, loaded]);

  function addItem(item: CartItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, total }}
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
