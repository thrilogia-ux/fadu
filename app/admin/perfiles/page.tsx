"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadAdminImage } from "@/lib/upload-image-client";

type ProfileAvatarItem = {
  id: string;
  src: string;
  label: string;
  order: number;
  active: boolean;
};

function newId() {
  return `avatar-${Date.now().toString(36)}`;
}

export default function AdminPerfilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatars, setAvatars] = useState<ProfileAvatarItem[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/perfiles");
    } else if (session && (session.user as { role?: string }).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") {
      loadAvatars();
    }
  }, [session]);

  async function loadAvatars() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/profile-avatars");
      if (!res.ok) throw new Error("No se pudieron cargar");
      const data = await res.json();
      setAvatars(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar los avatares");
    } finally {
      setLoading(false);
    }
  }

  function updateAvatar(id: string, patch: Partial<ProfileAvatarItem>) {
    setAvatars((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function moveAvatar(id: string, dir: -1 | 1) {
    setAvatars((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(next, 0, item);
      return copy.map((a, i) => ({ ...a, order: i }));
    });
  }

  function removeAvatar(id: string) {
    setAvatars((prev) => prev.filter((a) => a.id !== id).map((a, i) => ({ ...a, order: i })));
  }

  function addAvatar() {
    setAvatars((prev) => [
      ...prev,
      {
        id: newId(),
        src: "",
        label: "Nuevo avatar",
        order: prev.length,
        active: true,
      },
    ]);
  }

  async function handleUpload(id: string, file: File) {
    setUploadingId(id);
    setError("");
    try {
      const url = await uploadAdminImage(file);
      updateAvatar(id, { src: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir imagen");
    } finally {
      setUploadingId(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    const invalid = avatars.some((a) => !a.src.trim());
    if (invalid) {
      setError("Cada avatar debe tener una imagen (URL o archivo subido)");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/profile-avatars", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatars }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "No se pudo guardar");
        return;
      }
      setAvatars(Array.isArray(data) ? data : avatars);
      setMessage("Avatares guardados. Los usuarios los verán en su perfil.");
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando…</div>;
  }

  if (!session || (session.user as { role?: string }).role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/admin" className="text-sm text-[#0f3bff] hover:underline">
              ← Admin
            </Link>
            <h1 className="text-2xl font-bold">Perfiles — Avatares</h1>
            <p className="text-sm text-gray-600">
              Imágenes que los usuarios pueden elegir en Mi cuenta → Mis datos (grilla 4×4).
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d32cc] disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        {message && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>}
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {avatars.map((avatar, index) => (
            <div
              key={avatar.id}
              className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/10">
                  {avatar.src ? (
                    avatar.src.startsWith("http") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar.src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Image src={avatar.src} alt="" width={64} height={64} unoptimized className="h-full w-full object-cover" />
                    )
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-gray-400">Sin img</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    type="text"
                    value={avatar.label}
                    onChange={(e) => updateAvatar(avatar.id, { label: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Nombre del avatar"
                  />
                  <input
                    type="url"
                    value={avatar.src}
                    onChange={(e) => updateAvatar(avatar.id, { src: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
                    placeholder="URL de imagen o subí un archivo"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200">
                  {uploadingId === avatar.id ? "Subiendo…" : "Subir imagen"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    disabled={uploadingId === avatar.id}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleUpload(avatar.id, f);
                      e.target.value = "";
                    }}
                  />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={avatar.active}
                    onChange={(e) => updateAvatar(avatar.id, { active: e.target.checked })}
                  />
                  Activo
                </label>
                <button
                  type="button"
                  onClick={() => moveAvatar(avatar.id, -1)}
                  disabled={index === 0}
                  className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveAvatar(avatar.id, 1)}
                  disabled={index === avatars.length - 1}
                  className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeAvatar(avatar.id)}
                  disabled={avatars.length <= 1}
                  className="ml-auto rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addAvatar}
          className="w-full rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-600 hover:border-[#0f3bff] hover:text-[#0f3bff]"
        >
          + Agregar avatar
        </button>

        <p className="text-xs text-gray-500">
          Tip: podés reemplazar los SVG de muestra en <code className="rounded bg-gray-100 px-1">public/avatars/</code>{" "}
          o subir PNG/WebP desde acá. Los usuarios con Google verán su foto de Google además de estos avatares.
        </p>
      </main>
    </div>
  );
}
