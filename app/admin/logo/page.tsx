"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { uploadAdminLogo } from "@/lib/upload-image-client";
import {
  DEFAULT_FOOTER_LOGO,
  DEFAULT_HEADER_LOGO,
  DEFAULT_STORE_LOGO_SETTINGS,
  logoResponsiveSizes,
  normalizeStoreLogoSettings,
  resolveFooterLogo,
  resolveHeaderLogo,
  type StoreLogoSettings,
} from "@/lib/store-logo";

function LogoPreview({
  src,
  baseHeight,
  label,
  bgClass,
  variant = "header",
}: {
  src: string;
  baseHeight: number;
  label: string;
  bgClass: string;
  variant?: "header" | "footer";
}) {
  const sizes = logoResponsiveSizes(baseHeight, variant);

  return (
    <div className={`rounded-xl border border-black/10 p-4 ${bgClass}`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="flex min-h-[88px] items-center justify-center">
        <span
          style={
            {
              "--logo-max-h": `${sizes.mobile}px`,
              "--logo-max-h-md": `${sizes.md}px`,
              "--logo-max-w": `min(72vw, ${sizes.maxMobile}px)`,
              "--logo-max-w-md": `${sizes.maxMd}px`,
            } as React.CSSProperties
          }
        >
          <Image
            src={src}
            alt="Vista previa del logo"
            width={300}
            height={92}
            unoptimized
            className="h-auto w-auto max-h-[var(--logo-max-h)] max-w-[var(--logo-max-w)] object-contain md:max-h-[var(--logo-max-h-md)] md:max-w-[var(--logo-max-w-md)]"
          />
        </span>
      </div>
    </div>
  );
}

export default function AdminLogoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"header" | "footer" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<StoreLogoSettings>(DEFAULT_STORE_LOGO_SETTINGS);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/logo");
    } else if (session && (session.user as { role?: string }).role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as { role?: string }).role === "admin") {
      void loadSettings();
    }
  }, [session]);

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/store-logo");
      if (!res.ok) throw new Error("No se pudo cargar");
      const data = await res.json();
      setSettings(normalizeStoreLogoSettings(data));
    } catch {
      setError("No se pudo cargar la configuración del logo");
    } finally {
      setLoading(false);
    }
  }

  const previewHeaderSrc = useMemo(() => resolveHeaderLogo(settings), [settings]);
  const previewFooterSrc = useMemo(() => resolveFooterLogo(settings), [settings]);

  async function handleUpload(target: "header" | "footer", file: File) {
    setUploading(target);
    setError("");
    setMessage("");
    try {
      const url = await uploadAdminLogo(file);
      if (target === "header") {
        setSettings((s) => ({ ...s, headerUrl: url }));
      } else {
        setSettings((s) => ({ ...s, footerUrl: url, useSameForFooter: false }));
      }
      setMessage("Imagen subida. Recordá guardar los cambios.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/store-logo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setSettings(normalizeStoreLogoSettings(data));
      setMessage("Logo actualizado. Los cambios ya están en el sitio.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function restoreDefaults() {
    setSettings({ ...DEFAULT_STORE_LOGO_SETTINGS });
    setMessage("Restauraste los valores por defecto. Guardá para aplicarlos.");
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!session || (session.user as { role?: string }).role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="mb-6 inline-block text-sm text-[#0f3bff] hover:underline">
          ← Volver al panel
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-[#1d1d1b]">Logo de la tienda</h1>
        <p className="mb-8 text-gray-600">
          Subí un logo temporal para campañas (Hot Sale, fiestas, etc.). Se aplica en el header y
          footer. Formatos: PNG o SVG.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-sm md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#1d1d1b]">Logo del header</h2>

            <LogoPreview
              src={previewHeaderSrc}
              baseHeight={settings.headerHeight}
              label="Vista previa"
              bgClass="bg-white mb-4"
              variant="header"
            />

            <div className="mb-4 flex flex-wrap gap-3">
              <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d32cc]">
                {uploading === "header" ? "Subiendo..." : "Subir PNG o SVG"}
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploading !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload("header", file);
                    e.target.value = "";
                  }}
                />
              </label>
              {settings.headerUrl && (
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, headerUrl: null }))}
                  className="min-h-[44px] rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Quitar logo custom
                </button>
              )}
            </div>

            <p className="mb-2 text-sm text-gray-600">
              Default: <code className="text-xs">{DEFAULT_HEADER_LOGO}</code>
            </p>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#1d1d1b]">
                Tamaño en header: {settings.headerHeight}px (mobile)
              </span>
              <input
                type="range"
                min={36}
                max={100}
                value={settings.headerHeight}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, headerHeight: Number(e.target.value) }))
                }
                className="w-full accent-[#0f3bff]"
              />
              <span className="mt-1 block text-xs text-gray-500">
                En desktop se escala automáticamente para no romper el layout.
              </span>
            </label>
          </section>

          <section className="rounded-xl border border-black/8 bg-white p-5 shadow-sm md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#1d1d1b]">Logo del footer</h2>

            <label className="mb-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={settings.useSameForFooter}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, useSameForFooter: e.target.checked }))
                }
                className="mt-1 h-4 w-4 accent-[#0f3bff]"
              />
              <span className="text-sm text-gray-700">
                Usar el mismo logo del header en el footer
              </span>
            </label>

            <LogoPreview
              src={previewFooterSrc}
              baseHeight={settings.footerHeight}
              label="Vista previa footer"
              bgClass="bg-gray-50 mb-4"
            />

            {!settings.useSameForFooter && (
              <div className="mb-4 flex flex-wrap gap-3">
                <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg bg-[#0f3bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d32cc]">
                  {uploading === "footer" ? "Subiendo..." : "Subir logo footer"}
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploading !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload("footer", file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {settings.footerUrl && (
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, footerUrl: null }))}
                    className="min-h-[44px] rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Quitar logo custom footer
                  </button>
                )}
              </div>
            )}

            <p className="mb-4 text-sm text-gray-600">
              Default footer: <code className="text-xs">{DEFAULT_FOOTER_LOGO}</code>
            </p>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#1d1d1b]">
                Tamaño en footer: {settings.footerHeight}px (mobile)
              </span>
              <input
                type="range"
                min={36}
                max={100}
                value={settings.footerHeight}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, footerHeight: Number(e.target.value) }))
                }
                className="w-full accent-[#0f3bff]"
              />
            </label>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || uploading !== null}
              className="min-h-[48px] flex-1 rounded-lg bg-[#0f3bff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0d32cc] disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={restoreDefaults}
              disabled={saving || uploading !== null}
              className="min-h-[48px] rounded-lg border border-black/15 px-6 py-3 text-sm font-semibold hover:bg-white disabled:opacity-60"
            >
              Restaurar logo original
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
