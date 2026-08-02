"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UserAvatar } from "@/components/UserAvatar";

type AvatarOption = {
  id: string;
  src: string;
  label: string;
};

type Props = {
  value: string | null;
  googleImage?: string | null;
  name?: string | null;
  email?: string | null;
  onChange: (src: string) => void;
  disabled?: boolean;
};

export function AvatarPicker({ value, googleImage, name, email, onChange, disabled }: Props) {
  const [presets, setPresets] = useState<AvatarOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile-avatars");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          setPresets(
            data.map((a: { id: string; src: string; label: string }) => ({
              id: a.id,
              src: a.src,
              label: a.label,
            }))
          );
        }
      } catch {
        /* fallback vacío */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const options = [
    ...(googleImage ? [{ id: "google", src: googleImage, label: "Foto de Google" }] : []),
    ...presets,
  ];

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-700">Foto de perfil</p>
      <div className="mb-4 flex items-center gap-3">
        <UserAvatar src={value} name={name} email={email} size={56} />
        <p className="text-sm text-gray-600">Se muestra en el header cuando iniciás sesión.</p>
      </div>
      <div className="grid max-w-xs grid-cols-4 gap-3">
        {options.map((opt) => {
          const selected = value === opt.src;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.src)}
              title={opt.label}
              className={`relative flex aspect-square items-center justify-center rounded-full p-0.5 transition focus:outline-none focus:ring-2 focus:ring-[#0f3bff]/40 disabled:opacity-50 ${
                selected ? "ring-2 ring-[#0f3bff]" : "ring-1 ring-black/10 hover:ring-[#0f3bff]/50"
              }`}
            >
              {opt.src.startsWith("http") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={opt.src}
                  alt={opt.label}
                  referrerPolicy="no-referrer"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <Image
                  src={opt.src}
                  alt={opt.label}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-full w-full rounded-full object-cover"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
