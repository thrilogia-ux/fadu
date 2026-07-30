"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ProductOption = { id: string; name: string; price: number; productType?: string };
type BundleRow = {
  id: string;
  name: string;
  productType: string;
  price: number;
  bundleDiscountPercent: number | null;
  bundleItemsAsParent: {
    quantity: number;
    component: { id: string; name: string; price: number; stock: number };
  }[];
};

export default function AdminBundlesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [bundleProductId, setBundleProductId] = useState("");
  const [productType, setProductType] = useState<"bundle_pack" | "bundle_combo">("bundle_pack");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState([{ componentProductId: "", quantity: "1" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/admin/bundles");
    else if (session && (session.user as { role?: string }).role !== "admin") router.push("/");
  }, [session, status, router]);

  async function load() {
    const [prods, bunds] = await Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/bundles").then((r) => r.json()),
    ]);
    setProducts(Array.isArray(prods) ? prods : []);
    setBundles(Array.isArray(bunds) ? bunds : []);
    setLoading(false);
  }

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") load();
  }, [session]);

  async function saveBundle() {
    if (!bundleProductId) {
      alert("Elegí el producto que representa el bundle (crealo antes en Productos)");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bundleProductId,
        productType,
        bundleDiscountPercent: parseInt(discountPercent, 10) || 0,
        price: price.trim() || undefined,
        items: items
          .filter((i) => i.componentProductId)
          .map((i) => ({
            componentProductId: i.componentProductId,
            quantity: parseInt(i.quantity, 10) || 1,
          })),
      }),
    });
    setSaving(false);
    if (res.ok) {
      alert("Bundle guardado");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Error al guardar");
    }
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  const standardProducts = products.filter(
    (p) => !p.productType || p.productType === "standard"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-2xl font-bold">Bundles</h1>
          <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
            ← Panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div className="rounded-xl border border-black/8 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Crear / editar bundle</h2>
          <p className="mb-4 text-sm text-gray-600">
            Primero creá un producto en Productos (será la ficha del pack/combo). Luego asignale
            los ítems acá.
          </p>

          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Producto bundle</label>
              <select
                value={bundleProductId}
                onChange={(e) => setBundleProductId(e.target.value)}
                className="w-full rounded-lg border border-black/15 px-3 py-2"
              >
                <option value="">Seleccionar…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select
                value={productType}
                onChange={(e) =>
                  setProductType(e.target.value as "bundle_pack" | "bundle_combo")
                }
                className="w-full rounded-lg border border-black/15 px-3 py-2"
              >
                <option value="bundle_pack">Pack fijo (precio del producto)</option>
                <option value="bundle_combo">Combo con descuento %</option>
              </select>
            </div>
          </div>

          {productType === "bundle_combo" && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Descuento %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-32 rounded-lg border border-black/15 px-3 py-2"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">
              Precio final (opcional; combo calcula solo si vacío)
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej. 15000"
              className="w-full rounded-lg border border-black/15 px-3 py-2"
            />
          </div>

          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium">Productos incluidos</p>
            {items.map((row, idx) => (
              <div key={idx} className="flex flex-wrap gap-2">
                <select
                  value={row.componentProductId}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...next[idx], componentProductId: e.target.value };
                    setItems(next);
                  }}
                  className="min-w-[200px] flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm"
                >
                  <option value="">Producto…</option>
                  {standardProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...next[idx], quantity: e.target.value };
                    setItems(next);
                  }}
                  className="w-20 rounded-lg border border-black/15 px-2 py-2 text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setItems([...items, { componentProductId: "", quantity: "1" }])}
              className="text-sm font-medium text-[#0f3bff] hover:underline"
            >
              + Agregar ítem
            </button>
          </div>

          <button
            type="button"
            onClick={saveBundle}
            disabled={saving}
            className="rounded-lg bg-[#0f3bff] px-6 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar bundle"}
          </button>
        </div>

        <div className="rounded-xl border border-black/8 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Bundles activos ({bundles.length})</h2>
          {bundles.length === 0 ? (
            <p className="text-sm text-gray-600">No hay bundles configurados.</p>
          ) : (
            <ul className="space-y-4">
              {bundles.map((b) => (
                <li key={b.id} className="rounded-lg border border-black/8 p-4">
                  <p className="font-semibold">
                    {b.name}{" "}
                    <span className="text-xs font-normal text-gray-500">
                      ({b.productType === "bundle_combo" ? "Combo" : "Pack"})
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    ${Number(b.price).toLocaleString("es-AR")}
                    {b.bundleDiscountPercent != null ? ` · ${b.bundleDiscountPercent}% off` : ""}
                  </p>
                  <ul className="mt-2 text-sm text-gray-700">
                    {b.bundleItemsAsParent.map((bi) => (
                      <li key={bi.component.id}>
                        {bi.quantity}× {bi.component.name}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
