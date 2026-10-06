import { cn } from "@/lib/utils";

/** Pulsing grey block shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-zinc-200/70", className)} />;
}
