import type { DashboardPeriod, Granularity } from "@/types/dashboard";

/** "৳1,250" for exact values. */
export function taka(amount: number): string {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

/** "৳950", "৳12.9K", "৳4.2M" for tiles and axis ticks. */
export function takaCompact(amount: number): string {
  return `৳${compact(amount)}`;
}

export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (abs >= 10_000) return `${trim(n / 1_000)}K`;
  return Math.round(n).toLocaleString("en-US");
}

const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "");

/** Whole-percent change, or null when there's nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  TODAY: "Today",
  WEEK: "This week",
  MONTH: "This month",
  YEAR: "This year",
};

/** Short axis label for a bucket. */
export function bucketLabel(iso: string, granularity: Granularity, period: DashboardPeriod): string {
  const d = new Date(iso);
  if (granularity === "HOUR") return d.toLocaleTimeString("en-US", { hour: "numeric" });
  if (granularity === "MONTH") return d.toLocaleDateString("en-US", { month: "short" });
  return period === "WEEK"
    ? d.toLocaleDateString("en-US", { weekday: "short" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Full label for tooltips and the table view. */
export function bucketTitle(iso: string, granularity: Granularity): string {
  const d = new Date(iso);
  if (granularity === "HOUR") {
    const end = new Date(d.getTime() + 3_600_000);
    const t = (x: Date) => x.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${t(d)} – ${t(end)}`;
  }
  if (granularity === "MONTH") return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
