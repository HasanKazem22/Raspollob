import type { IconType } from "react-icons";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { percentChange } from "./format";

/**
 * Change vs the previous period, written as a plain sentence ("12% more than last month").
 * The arrow and the words carry the meaning; color only reinforces it. Up is good for every card.
 */
export function ChangeText({ current, previous, previousLabel }: { current: number; previous: number; previousLabel: string }) {
  const change = percentChange(current, previous);

  if (change === null) {
    return <p className="text-xs text-zinc-400">Nothing to compare with {previousLabel}</p>;
  }
  if (change === 0) {
    return <p className="text-xs text-zinc-500">Same as {previousLabel}</p>;
  }

  const up = change > 0;
  const Icon = up ? LuArrowUp : LuArrowDown;
  return (
    <p className={cn("flex items-center gap-1 text-xs font-medium", up ? "text-[#3f6b1c]" : "text-red-600")}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {Math.abs(change)}% {up ? "more" : "less"} than {previousLabel}
    </p>
  );
}

/** One headline number with what it means and how it changed. */
export function StatCard({
  icon: Icon,
  label,
  description,
  value,
  current,
  previous,
  previousLabel,
}: {
  icon: IconType;
  label: string;
  /** Plain-language meaning, e.g. "Money from orders" */
  description: string;
  value: string;
  current: number;
  previous: number;
  previousLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{label}</p>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        <span className="w-9 h-9 shrink-0 rounded-xl bg-[#5c8b29]/10 text-[#4a7021] flex items-center justify-center">
          <Icon className="w-[18px] h-[18px]" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">{value}</p>
      <div className="mt-1.5">
        <ChangeText current={current} previous={previous} previousLabel={previousLabel} />
      </div>
    </div>
  );
}
