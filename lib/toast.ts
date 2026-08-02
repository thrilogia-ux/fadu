export type ToastVariant = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  actionHref?: string;
};

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn([...toasts]));
}

function nextId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}

export function showToast(
  message: string,
  options?: {
    variant?: ToastVariant;
    actionLabel?: string;
    actionHref?: string;
    durationMs?: number;
  }
) {
  const id = nextId();
  const item: ToastItem = {
    id,
    message,
    variant: options?.variant ?? "success",
    actionLabel: options?.actionLabel,
    actionHref: options?.actionHref,
  };
  toasts = [...toasts, item].slice(-4);
  emit();

  const duration = options?.durationMs ?? 3200;
  window.setTimeout(() => dismissToast(id), duration);
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function showAddedToCartToast(productName?: string) {
  const label = productName ? `"${productName}" agregado al carrito` : "Producto agregado al carrito";
  showToast(label, {
    variant: "success",
    actionLabel: "Ver carrito",
    actionHref: "/carrito",
    durationMs: 3600,
  });
}
