type Props = {
  rating: number;
  count?: number;
  size?: "sm" | "md";
};

export function StarRating({ rating, count, size = "sm" }: Props) {
  const stars = Math.max(0, Math.min(5, Math.round(rating * 2) / 2));
  const full = Math.floor(stars);
  const half = stars - full >= 0.5;
  const textSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <div className={`flex items-center gap-1 ${textSize} text-amber-500`}>
      <span className="leading-none" aria-hidden>
        {"★".repeat(full)}
        {half ? "⯨" : ""}
        {"☆".repeat(5 - full - (half ? 1 : 0))}
      </span>
      {count != null && count > 0 ? (
        <span className="text-gray-500">({count})</span>
      ) : null}
      <span className="sr-only">
        {rating.toFixed(1)} de 5 estrellas
        {count ? `, ${count} opiniones` : ""}
      </span>
    </div>
  );
}
