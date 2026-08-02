import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: Props) {
  return (
    <div className="rounded-xl border border-black/8 bg-white px-6 py-14 text-center shadow-sm sm:py-16">
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0f3bff]/8 text-3xl"
        aria-hidden
      >
        {icon ?? "✨"}
      </div>
      <h2 className="text-lg font-semibold text-[#1d1d1b] sm:text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{description}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href={primaryHref}
          className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-lg bg-[#0f3bff] px-6 font-semibold text-white transition hover:bg-[#0d32cc] active:bg-[#0a28a8]"
        >
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-black/15 px-6 font-medium text-[#1d1d1b] transition hover:bg-gray-50"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
