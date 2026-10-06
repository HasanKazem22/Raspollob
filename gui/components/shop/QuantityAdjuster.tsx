import React from "react";
import { LuMinus, LuPlus } from "react-icons/lu";

interface QuantityAdjusterProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  /** e.g. at quantity 1, when removal has its own button */
  disableDecrease?: boolean;
  /** e.g. when the quantity reaches available stock */
  disableIncrease?: boolean;
  className?: string;
  buttonClassName?: string;
  textClassName?: string;
  iconClassName?: string;
}

export function QuantityAdjuster({
  quantity,
  onDecrease,
  onIncrease,
  disableDecrease = false,
  disableIncrease = false,
  className = "w-full h-[34px] rounded-full border border-[#5c8b29] overflow-hidden bg-white",
  buttonClassName = "w-10 h-full bg-[#5c8b29] text-white flex items-center justify-center hover:bg-[#4a7021] transition-colors",
  textClassName = "font-bold text-sm text-zinc-900 flex-1 text-center",
  iconClassName = "w-4 h-4"
}: QuantityAdjusterProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disableDecrease}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDecrease(); }}
        className={`${buttonClassName} disabled:opacity-40 disabled:pointer-events-none`}
      >
        <LuMinus className={iconClassName} />
      </button>
      <span className={textClassName} aria-live="polite">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disableIncrease}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIncrease(); }}
        className={`${buttonClassName} disabled:opacity-40 disabled:pointer-events-none`}
      >
        <LuPlus className={iconClassName} />
      </button>
    </div>
  );
}
