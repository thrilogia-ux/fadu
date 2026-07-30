"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatVariantLabel, sortSizeLabels } from "@/lib/cart-line";
import { productInStock } from "@/lib/product-stock";
import { WaitlistButton } from "@/components/WaitlistButton";
import type { HomeProductPlain } from "@/lib/home-data";

type Variant = {
  id: string;
  sizeLabel: string;
  colorLabel: string;
  stock: number;
};

type QuickProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  useVariants?: boolean;
  showSizeSelector?: boolean;
  showColorSelector?: boolean;
  productType?: string;
  bundleDiscountPercent?: number | null;
  variants?: Variant[];
  images: { url: string }[];
  category?: { name: string; slug: string };
  bundleItems?: {
    quantity: number;
    component: { id: string; name: string; slug: string; price: number };
  }[];
};

type Props = {
  slug: string | null;
  initial?: HomeProductPlain | null;
  onClose: () => void;
};

function initialToQuickProduct(initial: HomeProductPlain): QuickProduct {
  return {
    id: initial.id,
    name: initial.name,
    slug: initial.slug,
    description: null,
    price: initial.price,
    compareAtPrice: initial.compareAtPrice,
    stock: initial.inStock ? 1 : 0,
    useVariants: false,
    showSizeSelector: false,
    showColorSelector: false,
    productType: initial.productType,
    images: initial.images,
    category: initial.category,
  };
}

async function fetchProductBySlug(slug: string): Promise<QuickProduct> {
  const load = async () => {
    const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(
        typeof data.error === "string" ? data.error : "No se pudo cargar el producto"
      );
    }
    return data as QuickProduct;
  };

  try {
    return await load();
  } catch (first) {
    await new Promise((r) => setTimeout(r, 400));
    return load();
  }
}

export function ProductQuickView({ slug, initial, onClose }: Props) {
  const { addItem } = useCart();
  const [product, setProduct] = useState<QuickProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!slug) return;
    setLoading(!initial);
    setError("");
    setProduct(initial ? initialToQuickProduct(initial) : null);
    setSelectedSize("");
    setSelectedColor("");
    setQty(1);

    let cancelled = false;

    fetchProductBySlug(slug)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (initial) {
          setError("");
          setProduct(initialToQuickProduct(initial));
        } else {
          setError(err instanceof Error ? err.message : "No se pudo cargar el producto");
          setProduct(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, initial?.id]);

  useEffect(() => {
    if (!slug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [slug, onClose]);

  const sizes = useMemo(() => {
    if (!product?.variants?.length) return [] as string[];
    return sortSizeLabels([
      ...new Set(product.variants.map((v) => v.sizeLabel).filter(Boolean)),
    ]);
  }, [product]);

  const colors = useMemo(() => {
    if (!product?.variants?.length) return [] as string[];
    return [
      ...new Set(
        product.variants
          .filter((v) => !selectedSize || v.sizeLabel === selectedSize)
          .map((v) => v.colorLabel)
          .filter(Boolean)
      ),
    ];
  }, [product, selectedSize]);

  const selectedVariant = useMemo(() => {
    if (!product?.useVariants || !product.variants?.length) return null;
    return (
      product.variants.find(
        (v) =>
          v.sizeLabel === (selectedSize || "") &&
          v.colorLabel === (selectedColor || "")
      ) ?? null
    );
  }, [product, selectedSize, selectedColor]);

  const effectiveStock = product?.useVariants
    ? selectedVariant?.stock ?? 0
    : product?.stock ?? 0;

  const inStock = product
    ? productInStock({
        stock: product.stock,
        useVariants: product.useVariants,
        variants: product.variants,
      })
    : false;

  const canAdd =
    product &&
    inStock &&
    effectiveStock > 0 &&
    (!product.useVariants || selectedVariant);

  function handleAdd() {
    if (!product || !canAdd) return;
    const variantLabel = formatVariantLabel(selectedSize, selectedColor, {
      showSize: Boolean(product.showSizeSelector),
      showColor: Boolean(product.showColorSelector),
    });
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      quantity: qty,
      image: product.images[0]?.url,
      variantLabel: variantLabel || undefined,
    });
    onClose();
  }

  if (!slug) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Vista rápida del producto"
      onClick={onClose}
    >
      <div
        className="flex max-h-[100dvh] w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[min(92dvh,900px)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-black/8 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 className="text-sm font-semibold text-[#1d1d1b]">Vista rápida</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loading && !product && (
          <div className="px-4 py-16 text-center text-sm text-gray-600">Cargando…</div>
        )}
        {error && !product && (
          <div className="px-4 py-16 text-center text-sm text-red-600">{error}</div>
        )}

        {product && !loading && (
          <div className="box-border w-full max-w-full p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="relative mx-auto mb-4 h-[min(38dvh,240px)] w-full max-w-full overflow-hidden rounded-lg bg-gray-50 sm:mb-4 sm:aspect-square sm:h-auto sm:max-h-none">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="400px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">Sin imagen</div>
              )}
              {!inStock && (
                <span className="absolute left-2 top-2 rounded-full bg-gray-900 px-2.5 py-1 text-xs font-bold text-white">
                  Sin stock
                </span>
              )}
            </div>

            {product.category && (
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                {product.category.name}
              </p>
            )}
            <h3 className="mb-2 break-words text-lg font-bold text-[#1d1d1b]">{product.name}</h3>
            <p className="mb-4 text-xl font-bold tabular-nums">
              ${Number(product.price).toLocaleString("es-AR")}
            </p>

            {product.bundleItems && product.bundleItems.length > 0 && (
              <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <p className="mb-1 font-semibold">Incluye:</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {product.bundleItems.map((b) => (
                    <li key={b.component.id}>
                      {b.quantity > 1 ? `${b.quantity}× ` : ""}
                      {b.component.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.useVariants && inStock && (
              <div className="mb-4 space-y-3">
                {product.showSizeSelector && sizes.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Talle</p>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`rounded-lg border px-3 py-1.5 text-sm ${
                            selectedSize === s
                              ? "border-[#0f3bff] bg-[#0f3bff]/10 font-semibold"
                              : "border-black/15"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {product.showColorSelector && colors.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Color</p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`rounded-lg border px-3 py-1.5 text-sm ${
                            selectedColor === c
                              ? "border-[#0f3bff] bg-[#0f3bff]/10 font-semibold"
                              : "border-black/15"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {inStock ? (
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                <div className="flex shrink-0 items-center gap-2">
                  <label className="text-sm text-gray-600">Cant.</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, effectiveStock)}
                    value={qty}
                    onChange={(e) =>
                      setQty(Math.min(effectiveStock, Math.max(1, Number(e.target.value) || 1)))
                    }
                    className="w-16 rounded-lg border border-black/15 px-2 py-2 text-center text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={!canAdd}
                  onClick={handleAdd}
                  className="min-h-[44px] min-w-0 flex-1 rounded-lg bg-[#0f3bff] px-4 py-2.5 text-sm font-semibold text-white disabled:bg-gray-300"
                >
                  Agregar al carrito
                </button>
              </div>
            ) : (
              <WaitlistButton productId={product.id} variantId={selectedVariant?.id} />
            )}

            <Link
              href={`/producto/${product.slug}`}
              className="mt-4 block text-center text-sm font-medium text-[#0f3bff] hover:underline"
              onClick={onClose}
            >
              Ver ficha completa →
            </Link>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
