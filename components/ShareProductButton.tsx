"use client";

import { useState } from "react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { STORE_NAME } from "@/lib/brand";

type Props = {
  productName: string;
  slug: string;
};

function productUrl(slug: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/producto/${slug}`;
  }
  return `/producto/${slug}`;
}

export function ShareProductButton({ productName, slug }: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = `Mirá "${productName}" en ${STORE_NAME}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(productUrl(slug));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    const url = productUrl(slug);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: productName, text: shareText, url });
        return;
      } catch {
        /* cancel or unsupported */
      }
    }
    copyLink();
  }

  const whatsappUrl = buildWhatsAppUrl(`${shareText}\n${productUrl(slug)}`);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={nativeShare}
        className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm font-medium text-[#1d1d1b] transition hover:bg-gray-50"
      >
        <span aria-hidden>↗</span>
        {copied ? "Link copiado" : "Compartir"}
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-2 text-sm font-medium text-[#128C7E] transition hover:bg-[#25D366]/15"
      >
        <span aria-hidden>💬</span>
        WhatsApp
      </a>
    </div>
  );
}
