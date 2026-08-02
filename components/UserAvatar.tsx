"use client";

import Image from "next/image";
import { userInitials } from "@/lib/profile-avatars";

type Props = {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
};

export function UserAvatar({ src, name, email, size = 32, className = "" }: Props) {
  const dimension = `${size}px`;
  const initials = userInitials(name, email);

  if (src) {
    const isExternal = src.startsWith("http://") || src.startsWith("https://");

    if (isExternal) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          className={`shrink-0 rounded-full object-cover ring-1 ring-black/10 ${className}`}
          style={{ width: dimension, height: dimension }}
        />
      );
    }

    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={`shrink-0 rounded-full object-cover ring-1 ring-black/10 ${className}`}
        style={{ width: dimension, height: dimension }}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#0f3bff] font-semibold text-white ring-1 ring-black/10 ${className}`}
      style={{ width: dimension, height: dimension, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
