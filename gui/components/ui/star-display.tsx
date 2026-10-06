import React from "react";
import { LuStar } from "react-icons/lu";

export function StarRating({ rating, className = "w-3.5 h-3.5" }: { rating: number; className?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <LuStar
          key={s}
          className={`${className} ${s <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`}
        />
      ))}
    </div>
  );
}

export function StarBadge({ 
  rating, 
  reviewCount,
  iconClassName = "w-3.5 h-3.5",
  textClassName = "text-xs font-bold text-zinc-800",
  countClassName = "text-[11px] text-zinc-400"
}: { 
  rating: string | number; 
  reviewCount?: number;
  iconClassName?: string;
  textClassName?: string;
  countClassName?: string;
}) {
  return (
    <div className="flex items-center gap-1 mb-2">
      <LuStar className={`${iconClassName} fill-amber-400 text-amber-400`} />
      <span className={textClassName}>{rating}</span>
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className={countClassName}>({reviewCount})</span>
      )}
    </div>
  );
}
