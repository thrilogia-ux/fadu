"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  category: { name: string };
  images: { url: string }[];
};

function SortableProductRow({
  product,
  type,
}: {
  product: Product;
  type: "featured" | "offers";
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent =
    hasDiscount && product.compareAtPrice
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
        )
      : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 rounded-lg border bg-white p-3 ${
        isDragging ? "z-10 shadow-lg opacity-90" : "border-black/10"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 active:cursor-grabbing"
        aria-label="Arrastrar para reordenar"
      >
        <span className="text-lg">≡</span>
      </button>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-gray-100">
        {product.images[0] ? (
          <Image
            src={product.images[0].url}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Sin img
          </div>
        )}
        {type === "offers" && hasDiscount && (
          <span className="absolute left-0 top-0 rounded-br bg-green-500 px-1 py-0.5 text-xs font-bold text-white">
            {discountPercent}%
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[#1d1d1b]">{product.name}</p>
        <p className="text-sm text-gray-500">{product.category.name}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold">${Number(product.price).toLocaleString("es-AR")}</p>
        {type === "offers" && product.compareAtPrice && (
          <p className="text-xs text-gray-400 line-through">
            ${Number(product.compareAtPrice).toLocaleString("es-AR")}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminPortadaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/portada");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as any).role === "admin") {
      Promise.all([
        fetch("/api/admin/home-order?type=featured").then((r) => r.json()),
        fetch("/api/admin/home-order?type=offers").then((r) => r.json()),
      ])
        .then(([featuredData, offersData]) => {
          setFeatured(Array.isArray(featuredData) ? featuredData : []);
          setOffers(Array.isArray(offersData) ? offersData : []);
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  async function handleFeaturedDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = featured.findIndex((p) => p.id === active.id);
    const newIndex = featured.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(featured, oldIndex, newIndex);
    setFeatured(newOrder);
    await saveOrder("featured", newOrder.map((p) => p.id));
  }

  async function handleOffersDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = offers.findIndex((p) => p.id === active.id);
    const newIndex = offers.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(offers, oldIndex, newIndex);
    setOffers(newOrder);
    await saveOrder("offers", newOrder.map((p) => p.id));
  }

  async function saveOrder(type: "featured" | "offers", productIds: string[]) {
    setSaving(type);
    try {
      const res = await fetch("/api/admin/home-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, productIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setSaving(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">Cargando...</div>
    );
  }

  if (!session || (session.user as any).role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Portada del home</h1>
            <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
              ← Volver al panel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="mb-8 text-sm text-gray-600">
          Arrastrá los productos para cambiar el orden en el home. Para agregar o quitar productos,
          editá cada uno en{" "}
          <Link href="/admin/productos" className="text-[#0f3bff] hover:underline">
            Productos
          </Link>
          .
        </p>

        {/* Destacados */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">Productos destacados</h2>
          <p className="mb-4 text-sm text-gray-600">
            Orden de aparición en la sección Destacados del home
          </p>
          {saving === "featured" && (
            <p className="mb-2 text-sm text-amber-600">Guardando...</p>
          )}
          <div className="space-y-2">
            {featured.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                No hay productos destacados. Marcá productos como &quot;Destacado&quot; en la
                edición de cada uno.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleFeaturedDragEnd}
              >
                <SortableContext
                  items={featured.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {featured.map((product) => (
                    <SortableProductRow
                      key={product.id}
                      product={product}
                      type="featured"
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </section>

        {/* Ofertas */}
        <section>
          <h2 className="mb-4 text-xl font-bold">Ofertas imperdibles</h2>
          <p className="mb-4 text-sm text-gray-600">
            Orden de aparición en la sección Ofertas del home (productos con precio anterior)
          </p>
          {saving === "offers" && (
            <p className="mb-2 text-sm text-amber-600">Guardando...</p>
          )}
          <div className="space-y-2">
            {offers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                No hay ofertas. Agregá un &quot;Precio anterior (oferta)&quot; a los productos.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleOffersDragEnd}
              >
                <SortableContext
                  items={offers.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {offers.map((product) => (
                    <SortableProductRow
                      key={product.id}
                      product={product}
                      type="offers"
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
