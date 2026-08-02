export function ProductCardSkeleton() {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-black/8 bg-white shadow-sm">
      <div className="aspect-square animate-pulse bg-gray-200" />
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200" />
        <div className="mt-auto space-y-2 pt-2">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-black/8 bg-white p-6"
        >
          <div className="mb-3 h-5 w-40 rounded bg-gray-200" />
          <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
