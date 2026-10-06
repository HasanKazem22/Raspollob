"use client";

import { useState } from "react";
import { LuStar } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

export interface StarRatingInputProps {
  value?: number | null;
  onChange: (val: number) => void;
  disabled?: boolean;
  className?: string;
}

export function StarRatingInput({
  value = 5.0,
  onChange,
  disabled = false,
  className,
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : (value ?? 5.0);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const label = `${star} star${star > 1 ? "s" : ""}`;
          return (
            <Tooltip key={star} content={label} side="top">
            <button
              aria-label={label}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => !disabled && setHoverRating(star)}
              onMouseLeave={() => !disabled && setHoverRating(null)}
              className={cn(
                "p-0.5 rounded transition-transform cursor-pointer focus:outline-none",
                !disabled && "hover:scale-115 active:scale-95",
                disabled && "cursor-default"
              )}
            >
              <LuStar
                className={cn(
                  "w-5 h-5 transition-colors",
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "text-zinc-300 dark:text-zinc-600"
                )}
              />
            </button>
            </Tooltip>
          );
        })}
      </div>
      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 min-w-7">
        {displayRating.toFixed(1)}
      </span>
    </div>
  );
}
