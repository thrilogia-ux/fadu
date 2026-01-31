"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string | null;
  categoryId: string;
  category: { id: string; name: string };
  featured: boolean;
  active: boolean;
  images: { id: string; url: string; order: number; isPrimary: boolean }[];
  videos: { id: string; url: string | null }[];
}

export default function AdminProductosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    stock: "0",
    sku: "",
    categoryId: "",
    featured: false,
    active: true,
    images: [{ url: "", isPrimary: true }] as { url: string; isPrimary: boolean }[],
    videos: [""] as string[],
  });
  const [uploadingImageIdx, setUploadingImageIdx] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/productos");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as any).role === "admin") {
      Promise.all([
        fetch("/api/admin/products").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
      ]).then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
        setLoading(false);
      });
    }
  }, [session]);

  function openNew() {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "",
      compareAtPrice: "",
      stock: "0",
      sku: "",
      categoryId: categories[0]?.id || "",
      featured: false,
      active: true,
      images: [{ url: "", isPrimary: true }],
      videos: [""],
    });
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
      stock: String(product.stock),
      sku: product.sku || "",
      categoryId: product.categoryId,
      featured: product.featured,
      active: product.active,
      images: product.images.length 
        ? product.images.map((i) => ({ url: i.url, isPrimary: i.isPrimary })) 
        : [{ url: "", isPrimary: true }],
      videos: product.videos.length 
        ? product.videos.map((v) => v.url || "") 
        : [""],
    });
    setShowForm(true);
  }

  // Imagen handlers
  function addImage() {
    setForm({ ...form, images: [...form.images, { url: "", isPrimary: false }] });
  }

  function updateImage(idx: number, url: string) {
    const updated = [...form.images];
    updated[idx].url = url;
    setForm({ ...form, images: updated });
  }

  function removeImage(idx: number) {
    if (form.images.length === 1) return;
    const updated = form.images.filter((_, i) => i !== idx);
    // Si removemos la principal, hacer la primera como principal
    if (form.images[idx].isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setForm({ ...form, images: updated });
  }

  function setPrimaryImage(idx: number) {
    const updated = form.images.map((img, i) => ({ ...img, isPrimary: i === idx }));
    setForm({ ...form, images: updated });
  }

  async function handleImageUpload(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadingImageIdx(idx);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Error al subir");
        return;
      }

      updateImage(idx, data.url);
    } catch {
      setUploadError("Error de conexión");
    } finally {
      setUploadingImageIdx(null);
      e.target.value = "";
    }
  }

  // Video handlers
  function addVideo() {
    setForm({ ...form, videos: [...form.videos, ""] });
  }

  function updateVideo(idx: number, url: string) {
    const updated = [...form.videos];
    updated[idx] = url;
    setForm({ ...form, videos: updated });
  }

  function removeVideo(idx: number) {
    const updated = form.videos.filter((_, i) => i !== idx);
    setForm({ ...form, videos: updated.length ? updated : [""] });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const images = form.images
      .filter((img) => img.url.trim())
      .map((img, idx) => ({ url: img.url, isPrimary: img.isPrimary || idx === 0 }));
    
    const videos = form.videos.filter((url) => url.trim());

    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      compareAtPrice: form.compareAtPrice || null,
      stock: form.stock,
      sku: form.sku || null,
      categoryId: form.categoryId,
      featured: form.featured,
      active: form.active,
      images,
      videos,
    };

    const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        const prods = await fetch("/api/admin/products").then((r) => r.json());
        setProducts(prods);
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch {
      alert("Error al eliminar");
    }
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session || (session.user as any).role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Productos ({products.length})</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={openNew}
                className="rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d32cc]"
              >
                + Nuevo producto
              </button>
              <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
                ← Volver al panel
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
              <h2 className="mb-6 text-xl font-bold">
                {editing ? "Editar producto" : "Nuevo producto"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Info básica */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Nombre *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Precio *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Precio anterior (oferta)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.compareAtPrice}
                      onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Stock</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">SKU</label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Categoría *</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      required
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-6 pt-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Destacado</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => setForm({ ...form, active: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Activo</span>
                    </label>
                  </div>
                </div>

                {/* Imágenes */}
                <div className="rounded-lg border border-black/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium">
                      📷 Imágenes del producto
                    </label>
                    <button
                      type="button"
                      onClick={addImage}
                      className="text-sm text-[#0f3bff] hover:underline"
                    >
                      + Agregar imagen
                    </button>
                  </div>
                  <p className="mb-3 text-xs text-gray-500">
                    Subí imágenes o pegá URLs. La imagen marcada como "Principal" se mostrará primero. Máx. 5MB (JPEG, PNG, WebP, GIF).
                  </p>
                  {uploadError && (
                    <p className="mb-2 text-sm text-red-600">{uploadError}</p>
                  )}
                  <div className="space-y-3">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="flex flex-wrap items-start gap-3">
                        {/* Preview */}
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {img.url ? (
                            <Image
                              src={img.url}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-400 text-xs">
                              Vista previa
                            </div>
                          )}
                        </div>

                        {/* Upload button + URL input */}
                        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                          <label className="shrink-0 cursor-pointer rounded-lg border border-[#0f3bff] bg-[#0f3bff]/5 px-3 py-2 text-xs font-medium text-[#0f3bff] transition hover:bg-[#0f3bff]/10">
                            {uploadingImageIdx === idx ? "Subiendo…" : "Subir"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={(e) => handleImageUpload(idx, e)}
                              disabled={uploadingImageIdx !== null}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="url"
                            value={img.url}
                            onChange={(e) => {
                              updateImage(idx, e.target.value);
                              setUploadError("");
                            }}
                            placeholder="o pegá URL de imagen"
                            className="min-w-0 flex-1 rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#0f3bff]"
                          />
                        </div>
                        
                        {/* Primary toggle */}
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(idx)}
                          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                            img.isPrimary
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {img.isPrimary ? "✓ Principal" : "Hacer principal"}
                        </button>
                        
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          disabled={form.images.length === 1}
                          className="shrink-0 rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Videos */}
                <div className="rounded-lg border border-black/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium">
                      🎬 Videos del producto
                    </label>
                    <button
                      type="button"
                      onClick={addVideo}
                      className="text-sm text-[#0f3bff] hover:underline"
                    >
                      + Agregar video
                    </button>
                  </div>
                  <p className="mb-3 text-xs text-gray-500">
                    Pegá URLs de YouTube, Vimeo o links directos a archivos de video (.mp4)
                  </p>
                  
                  <div className="space-y-3">
                    {form.videos.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-xl">🎥</span>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => updateVideo(idx, e.target.value)}
                          placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                          className="flex-1 rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-[#0f3bff]"
                        />
                        <button
                          type="button"
                          onClick={() => removeVideo(idx)}
                          className="rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 rounded-lg border border-black/20 py-2.5 font-semibold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-[#0f3bff] py-2.5 font-semibold text-white hover:bg-[#0d32cc]"
                  >
                    Guardar producto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista */}
        {products.length === 0 ? (
          <div className="rounded-lg border border-black/8 bg-white p-12 text-center">
            <p className="mb-4 text-gray-600">No hay productos</p>
            <button onClick={openNew} className="text-[#0f3bff] hover:underline">
              Crear el primer producto
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-lg border border-black/8 bg-white"
              >
                <div className="relative h-40 bg-gray-100">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Sin imagen
                    </div>
                  )}
                  {!product.active && (
                    <span className="absolute right-2 top-2 rounded bg-red-500 px-2 py-0.5 text-xs text-white">
                      Inactivo
                    </span>
                  )}
                  {product.featured && (
                    <span className="absolute left-2 top-2 rounded bg-yellow-400 px-2 py-0.5 text-xs">
                      ⭐ Destacado
                    </span>
                  )}
                  {/* Indicadores de media */}
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {product.images.length > 1 && (
                      <span className="rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                        📷 {product.images.length}
                      </span>
                    )}
                    {product.videos.length > 0 && (
                      <span className="rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                        🎬 {product.videos.length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.category.name}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold">
                      ${Number(product.price).toLocaleString("es-AR")}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ${Number(product.compareAtPrice).toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Stock: {product.stock}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-medium hover:bg-gray-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
