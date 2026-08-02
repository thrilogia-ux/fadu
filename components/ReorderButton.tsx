"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { showToast } from "@/lib/toast";

type ReorderItem = {
  productId: string | null;
  variantId?: string | null;
  quantity: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    active: boolean;
    stock: number;
    useVariants: boolean;
    images: { url: string }[];
    variants?: { id: string; stock: number; sizeLabel: string; colorLabel: string }[];
  } | null;
  variantSizeLabel?: string | null;
  variantColorLabel?: string | null;
  available: boolean;
  reason?: string;
};

type Props = {
  orderId: string;
  className?: string;
  variant?: "button" | "link";
};

export function ReorderButton({ orderId, className = "", variant = "button" }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);

  async function handleReorder() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo repetir el pedido");
        return;
      }

      const items = (data.items ?? []) as ReorderItem[];
      const added = items.filter((i) => i.available && i.product);
      const skipped = items.filter((i) => !i.available);

      for (const line of added) {
        const p = line.product!;
        const variantMatch = line.variantId
          ? p.variants?.find((v) => v.id === line.variantId)
          : null;
        const parts: string[] = [];
        if (line.variantSizeLabel?.trim()) parts.push(`Talle ${line.variantSizeLabel.trim()}`);
        if (line.variantColorLabel?.trim()) parts.push(line.variantColorLabel.trim());
        addItem(
          {
            productId: p.id,
            variantId: line.variantId ?? undefined,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            quantity: line.quantity,
            image: p.images[0]?.url,
            variantLabel: parts.length ? parts.join(" · ") : undefined,
          },
          { silent: true }
        );
      }

      if (added.length > 0) {
        showToast(
          added.length === 1
            ? "Producto agregado al carrito"
            : `${added.length} productos agregados al carrito`,
          { variant: "success", actionLabel: "Ver carrito", actionHref: "/carrito" }
        );
      }

      if (skipped.length > 0) {
        const names = skipped
          .map((s) => s.product?.name || "un producto")
          .join(", ");
        alert(
          added.length > 0
            ? `Se agregaron ${added.length} producto(s). No disponibles: ${names}`
            : `No hay productos disponibles para repetir este pedido.`
        );
      }

      if (added.length > 0) {
        router.push("/carrito");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const base =
    variant === "link"
      ? "text-sm font-semibold text-[#0f3bff] hover:underline disabled:opacity-50"
      : "inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-[#0f3bff] bg-white px-4 text-sm font-semibold text-[#0f3bff] transition hover:bg-[#0f3bff]/5 disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={handleReorder}
      disabled={loading}
      className={`${base} ${className}`}
    >
      {loading ? "Agregando…" : "Volver a comprar"}
    </button>
  );
}
