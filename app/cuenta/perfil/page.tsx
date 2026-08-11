"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AvatarPicker } from "@/components/AvatarPicker";
import { FADU_CAREER_OPTIONS, faduCareerLabel } from "@/lib/fadu-careers";
import { isGoogleProfileImage } from "@/lib/profile-avatars";

type Profile = {
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsappNotify?: boolean;
  faduCareer: string | null;
  faduCareerOther: string | null;
  image: string | null;
};

export default function PerfilPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNotify, setWhatsappNotify] = useState(false);
  const [faduCareer, setFaduCareer] = useState("");
  const [faduCareerOther, setFaduCareerOther] = useState("");
  const [emailDisplay, setEmailDisplay] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [hasGoogleAccount, setHasGoogleAccount] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/cuenta/perfil");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/user/profile");
        if (res.status === 401) {
          router.push("/login?callbackUrl=/cuenta/perfil");
          return;
        }
        if (!res.ok) {
          throw new Error("No se pudieron cargar los datos");
        }
        const data = (await res.json()) as Profile & { hasGoogleAccount?: boolean };
        if (cancelled) return;
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setWhatsappNotify(Boolean(data.whatsappNotify));
        setFaduCareer(data.faduCareer ?? "");
        setFaduCareerOther(data.faduCareerOther ?? "");
        setEmailDisplay(data.email ?? "");
        setProfileImage(data.image ?? null);
        setHasGoogleAccount(Boolean(data.hasGoogleAccount));
      } catch {
        if (!cancelled) setError("No se pudieron cargar tus datos. Probá de nuevo más tarde.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setOk(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          whatsappNotify,
          faduCareer: faduCareer || "",
          faduCareerOther: faduCareer === "otra" ? faduCareerOther : "",
          image: profileImage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "No se pudo guardar");
        return;
      }
      setOk(true);
      const newName = typeof data.name === "string" ? data.name : name;
      const newImage = typeof data.image === "string" ? data.image : profileImage;
      if (newImage !== session?.user?.image) {
        await update({ name: newName || undefined, image: newImage ?? null });
      } else {
        await update(newName ? { name: newName } : undefined);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        Cargando…
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const googleImageOption =
    session.user.image && isGoogleProfileImage(session.user.image)
      ? session.user.image
      : profileImage && isGoogleProfileImage(profileImage)
        ? profileImage
        : null;

  return (
    <>
      <Header categories={[]} />

      <main className="min-h-screen overflow-x-hidden bg-gray-50 py-6 pb-12 md:py-8">
        <div className="mx-auto w-full max-w-lg px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1d1d1b]">Mis datos</h1>
            <Link href="/cuenta" className="text-sm font-medium text-[#0f3bff] hover:underline">
              ← Mi cuenta
            </Link>
          </div>

          <p className="mb-6 text-sm text-gray-600">
            Completá tu perfil para futuras novedades y promos según tu carrera en FADU. Tu email de
            inicio de sesión no se puede cambiar desde acá.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-lg border border-black/8 bg-white p-6 shadow-sm"
          >
            <AvatarPicker
              value={profileImage}
              googleImage={googleImageOption}
              name={name || session.user.name}
              email={emailDisplay || session.user.email}
              onChange={setProfileImage}
              disabled={saving}
            />
            {hasGoogleAccount && !googleImageOption && (
              <p className="-mt-2 text-xs text-gray-500">
                Para volver a tu foto de Google, cerrá sesión e ingresá de nuevo con Google.
              </p>
            )}

            <hr className="border-black/8" />

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={emailDisplay}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-600"
              />
            </div>

            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Nombre y apellido
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                maxLength={120}
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Teléfono (opcional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="Ej. +54 11 1234-5678"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                maxLength={40}
              />
              <label className="mt-3 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={whatsappNotify}
                  onChange={(e) => setWhatsappNotify(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#0f3bff]"
                />
                <span className="text-sm text-gray-600">
                  Quiero recibir avisos por WhatsApp sobre mis pedidos (listo para retirar o enviado).
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="career" className="mb-1 block text-sm font-medium text-gray-700">
                Carrera en FADU
              </label>
              <select
                id="career"
                value={faduCareer}
                onChange={(e) => setFaduCareer(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-[#0f3bff]"
              >
                <option value="">Elegí una opción</option>
                {FADU_CAREER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {faduCareer && faduCareer !== "otra" && (
                <p className="mt-1 text-xs text-gray-500">
                  Opción guardada: <strong>{faduCareerLabel(faduCareer)}</strong>
                </p>
              )}
            </div>

            {faduCareer === "otra" && (
              <div>
                <label htmlFor="careerOther" className="mb-1 block text-sm font-medium text-gray-700">
                  Contanos cuál
                </label>
                <textarea
                  id="careerOther"
                  value={faduCareerOther}
                  onChange={(e) => setFaduCareerOther(e.target.value)}
                  rows={3}
                  maxLength={255}
                  placeholder="Ej. Posgrado, otra facultad, invitado…"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-[#0f3bff]"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {ok && <p className="text-sm text-green-700">Cambios guardados correctamente.</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[#0f3bff] py-3 font-semibold text-white hover:bg-[#0d32cc] disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
