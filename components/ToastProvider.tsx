"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dismissToast, subscribeToasts, type ToastItem } from "@/lib/toast";

function ToastItemView({ toast }: { toast: ToastItem }) {
  const colors =
    toast.variant === "error"
      ? "border-red-200 bg-red-50 text-red-900"
      : toast.variant === "info"
        ? "border-blue-200 bg-blue-50 text-blue-900"
        : "border-green-200 bg-green-50 text-green-900";

  return (
    <div
      role="status"
      className={`flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${colors}`}
    >
      <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>
      {toast.actionHref && toast.actionLabel ? (
        <Link
          href={toast.actionHref}
          className="shrink-0 text-sm font-semibold underline underline-offset-2"
          onClick={() => dismissToast(toast.id)}
        >
          {toast.actionLabel}
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="shrink-0 rounded p-1 opacity-60 transition hover:opacity-100"
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-24 left-4 right-4 z-[200] flex flex-col gap-2 md:bottom-8 md:left-auto md:right-28 md:w-[min(100%,22rem)]"
      aria-live="polite"
    >
      {items.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItemView toast={toast} />
        </div>
      ))}
    </div>
  );
}
