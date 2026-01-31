"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface HeroSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  order: number;
  active: boolean;
}

export default function AdminHeroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
    imageUrl: "",
    order: 0,
    active: true,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/hero");
    } else if (session && (session.user as any).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as any).role === "admin") {
      loadSlides();
    }
  }, [session]);

  async function loadSlides() {
    try {
      const res = await fetch("/api/admin/hero-slides");
      if (res.ok) {
        setSlides(await res.json());
      }
    } catch (error) {
      console.error("Error loading slides:", error);
    }
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({
      title: "",
      subtitle: "",
      buttonText: "",
      buttonLink: "",
      imageUrl: "",
      order: slides.length,
      active: true,
    });
    setShowForm(true);
  }

  function openEdit(slide: HeroSlide) {
    setEditing(slide);
    setForm({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      buttonText: slide.buttonText || "",
      buttonLink: slide.buttonLink || "",
      imageUrl: slide.imageUrl || "",
      order: slide.order,
      active: slide.active,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editing
      ? `/api/admin/hero-slides/${editing.id}`
      : "/api/admin/hero-slides";
    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        loadSlides();
      } else {
        alert("Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este slide?")) return;

    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadSlides();
      }
    } catch {
      alert("Error al eliminar");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Error al subir");
        return;
      }

      setForm({ ...form, imageUrl: data.url });
    } catch {
      setUploadError("Error de conexión");
    } finally {
      setUploading(false);
      e.target.value = "";
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
            <h1 className="text-2xl font-bold">Hero Slides</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={openNew}
                className="rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d32cc]"
              >
                + Nuevo slide
              </button>
              <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
                ← Volver al panel
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Modal/Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
              <h2 className="mb-6 text-xl font-bold">
                {editing ? "Editar slide" : "Nuevo slide"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Título</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Diseño y arquitectura para tu espacio"
                    className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Subtítulo / Bajada</label>
                  <textarea
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    rows={2}
                    placeholder="Descubrí productos exclusivos de iluminación, mobiliario y decoración."
                    className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Texto del botón</label>
                    <input
                      type="text"
                      value={form.buttonText}
                      onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                      placeholder="Ver ofertas"
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Link del botón</label>
                    <input
                      type="text"
                      value={form.buttonLink}
                      onChange={(e) => setForm({ ...form, buttonLink: e.target.value })}
                      placeholder="/ofertas"
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Imagen de fondo</label>
                  <div className="flex flex-wrap gap-2">
                    <label className="cursor-pointer rounded-lg border border-[#0f3bff] bg-[#0f3bff]/5 px-4 py-2.5 text-sm font-medium text-[#0f3bff] transition hover:bg-[#0f3bff]/10">
                      {uploading ? "Subiendo…" : "Subir imagen"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <span className="flex items-center text-sm text-gray-500">o pegá una URL</span>
                  </div>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => {
                      setForm({ ...form, imageUrl: e.target.value });
                      setUploadError("");
                    }}
                    placeholder="https://images.unsplash.com/... o URL de imagen"
                    className="mt-2 w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                  />
                  {uploadError && (
                    <p className="mt-1 text-sm text-red-600">{uploadError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Recomendado: 1920x600px mínimo. Máx. 5MB (JPEG, PNG, WebP, GIF).
                  </p>
                  {form.imageUrl && (
                    <div className="mt-2 relative h-32 w-full overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={form.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Orden</label>
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-black/20 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="active"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <label htmlFor="active" className="text-sm font-medium">
                      Activo
                    </label>
                  </div>
                </div>

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
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista de slides */}
        {slides.length === 0 ? (
          <div className="rounded-lg border border-black/8 bg-white p-12 text-center">
            <p className="mb-4 text-gray-600">No hay slides creados</p>
            <button
              onClick={openNew}
              className="text-[#0f3bff] hover:underline"
            >
              Crear el primer slide
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="flex items-center gap-4 rounded-lg border border-black/8 bg-white p-4"
              >
                {/* Preview */}
                <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {slide.imageUrl ? (
                    <Image src={slide.imageUrl} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0f3bff] to-[#0a2699]">
                      <span className="text-xs text-white">Sin imagen</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">#{slide.order}</span>
                    <h3 className="font-semibold">{slide.title || "(Sin título)"}</h3>
                    {!slide.active && (
                      <span className="rounded bg-gray-200 px-2 py-0.5 text-xs">Inactivo</span>
                    )}
                  </div>
                  {slide.subtitle && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-1">{slide.subtitle}</p>
                  )}
                  {slide.buttonText && (
                    <p className="mt-1 text-xs text-gray-500">
                      Botón: {slide.buttonText} → {slide.buttonLink}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(slide)}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
