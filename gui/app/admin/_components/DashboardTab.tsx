"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuChevronDown,
  LuCircleAlert,
  LuRefreshCw,
  LuShoppingBag,
  LuTriangleAlert,
  LuUsers,
  LuWallet,
  LuBanknote,
} from "react-icons/lu";
import { dashboardService } from "@/services/dashboardService";
import { useAuth } from "@/context/AuthContext";
import { Dropdown } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { DashboardData, DashboardPeriod } from "@/types/dashboard";
import type { OrderStatus, PaymentMethod } from "@/types/order";
import { bucketLabel, bucketTitle, PERIOD_LABEL, taka, takaCompact } from "./dashboard/format";
import { StatCard } from "./dashboard/KpiTiles";
import { TrendChart, TrendTable, TrendPoint } from "./dashboard/TrendChart";
import { BarList, Panel, TodoList } from "./dashboard/Panels";

const PERIODS: DashboardPeriod[] = ["TODAY", "WEEK", "MONTH", "YEAR"];
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const DETAILS_KEY = "dashboard_details_open";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function readDetailsOpen(): boolean {
  try {
    return localStorage.getItem(DETAILS_KEY) === "1";
  } catch {
    return false;
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[146px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Skeleton className="xl:col-span-2 h-[360px] rounded-2xl" />
        <Skeleton className="h-[360px] rounded-2xl" />
      </div>
    </div>
  );
}

export function DashboardTab() {
  const { user } = useAuth();
  const firstName = (user?.fullName || user?.username || "").split(" ")[0];

  const [period, setPeriod] = useState<DashboardPeriod>("MONTH");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(readDetailsOpen);
  // Bumped to re-fetch the same period (refresh button, auto-refresh, retry)
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true; // ignore responses from superseded requests
    dashboardService
      .get(period)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((err) => active && setError(err))
      .finally(() => active && setIsFetching(false));
    return () => {
      active = false;
    };
  }, [period, reloadKey]);

  const refresh = useCallback(() => {
    setIsFetching(true);
    setReloadKey((k) => k + 1);
  }, []);

  const changePeriod = (p: DashboardPeriod) => {
    if (p === period) return;
    setIsFetching(true);
    setPeriod(p);
  };

  const toggleDetails = () => {
    setDetailsOpen((open) => {
      try {
        localStorage.setItem(DETAILS_KEY, open ? "0" : "1");
      } catch {
        // Storage unavailable — the toggle still works for this visit
      }
      return !open;
    });
  };

  // Keep the numbers fresh while the tab is visible
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const periodName = PERIOD_LABEL[period].toLowerCase(); // "this month"

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {greeting()}
          {firstName && `, ${firstName}`}
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Here&apos;s how your store is doing {periodName}
          {data && (
            <span className="text-zinc-400">
              {" "}· updated {new Date(data.generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip content="Refresh">
        <button
          type="button"
          onClick={refresh}
          disabled={isFetching}
          aria-label="Refresh"
          className="w-9 h-9 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 cursor-pointer"
        >
          <LuRefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
        </button>
        </Tooltip>
        <Dropdown
          options={PERIODS.map((p) => ({ value: p, label: PERIOD_LABEL[p] }))}
          value={period}
          onChange={changePeriod}
          className="min-w-[150px] bg-white rounded-lg"
        />
      </div>
    </div>
  );

  if (error && !data) {
    return (
      <div className="space-y-5">
        {header}
        <ServerErrorCard error={error} onRetry={refresh} title="Couldn't load your dashboard" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-5">
        {header}
        <DashboardSkeleton />
      </div>
    );
  }

  const { current, previous, previousLabel, granularity } = data;
  const points: TrendPoint[] = data.series.map((p) => ({
    label: bucketLabel(p.bucketStart, granularity, data.period),
    title: bucketTitle(p.bucketStart, granularity),
    value: p.revenue,
    previous: p.previousRevenue,
  }));
  const chartLabel = `Sales ${periodName}`;
  const chartPrevLabel = previousLabel.charAt(0).toUpperCase() + previousLabel.slice(1); // "Last month"
  const outOfStock = data.attention.lowStockProducts.filter((p) => p.stock <= 0).length;

  return (
    <div className="space-y-5">
      {header}

      {/* Refetch keeps the frame: dim instead of flashing a skeleton */}
      <div className={cn("space-y-4 transition-opacity", isFetching && "opacity-60")} aria-busy={isFetching}>
        {/* ── The four numbers that matter ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={LuBanknote}
            label="Sales"
            description="Money from orders"
            value={taka(current.revenue)}
            current={current.revenue}
            previous={previous.revenue}
            previousLabel={previousLabel}
          />
          <StatCard
            icon={LuShoppingBag}
            label="Orders"
            description="Orders received"
            value={current.orders.toLocaleString("en-US")}
            current={current.orders}
            previous={previous.orders}
            previousLabel={previousLabel}
          />
          <StatCard
            icon={LuWallet}
            label="Profit"
            description="After product cost & discounts"
            value={taka(current.estimatedProfit)}
            current={current.estimatedProfit}
            previous={previous.estimatedProfit}
            previousLabel={previousLabel}
          />
          <StatCard
            icon={LuUsers}
            label="Customers"
            description="People who bought"
            value={current.uniqueBuyers.toLocaleString("en-US")}
            current={current.uniqueBuyers}
            previous={previous.uniqueBuyers}
            previousLabel={previousLabel}
          />
        </div>

        {/* ── Sales chart + what to do ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Panel
            className="xl:col-span-2"
            title={chartLabel}
            subtitle={`Compared with ${previousLabel}`}
            action={
              <button
                type="button"
                onClick={() => setShowTable((v) => !v)}
                className="text-xs font-semibold text-brand-strong hover:underline cursor-pointer"
              >
                {showTable ? "Show as chart" : "Show as table"}
              </button>
            }
          >
            {showTable ? (
              <TrendTable points={points} seriesLabel={chartLabel} previousLabel={chartPrevLabel} formatValue={taka} />
            ) : (
              <TrendChart
                points={points}
                seriesLabel={chartLabel}
                previousLabel={chartPrevLabel}
                formatValue={taka}
                formatTick={takaCompact}
              />
            )}
          </Panel>

          <Panel title="To do" subtitle="What needs your attention">
            <TodoList attention={data.attention} insights={data.insights} />
          </Panel>
        </div>

        {/* ── Everything else, one click away ── */}
        <section className="rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={toggleDetails}
            aria-expanded={detailsOpen}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
          >
            <span>
              <span className="block text-[15px] font-semibold tracking-tight text-zinc-900">More details</span>
              <span className="block text-xs text-zinc-500">Best sellers, stock, order status and payment methods</span>
            </span>
            <span className="flex items-center gap-2">
              {(outOfStock > 0 || data.attention.lowStockProducts.length > 0) && !detailsOpen && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  <LuTriangleAlert className="w-3 h-3" /> Stock alert
                </span>
              )}
              <LuChevronDown className={cn("w-5 h-5 text-zinc-400 transition-transform", detailsOpen && "rotate-180")} />
            </span>
          </button>

          {detailsOpen && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 px-5 pb-5 pt-1 border-t border-zinc-100">
              <div className="pt-4">
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Best sellers</h3>
                <BarList
                  emptyText="Nothing sold yet in this period."
                  rows={data.topProducts.map((p) => ({
                    key: String(p.productId),
                    label: p.name,
                    value: p.revenue,
                    display: taka(p.revenue),
                    sub: `· ${p.quantity} sold`,
                  }))}
                />
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-900">Low stock</h3>
                  <Link href="/admin/products" className="text-xs font-semibold text-brand-strong hover:underline">
                    Manage products
                  </Link>
                </div>
                {data.attention.lowStockProducts.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">All products have enough stock.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {data.attention.lowStockProducts.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="text-xs text-zinc-700 truncate">{p.name}</span>
                        {p.stock <= 0 ? (
                          <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold text-red-600">
                            <LuCircleAlert className="w-3.5 h-3.5" /> Sold out
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold text-amber-700">
                            <LuTriangleAlert className="w-3.5 h-3.5" /> Only {p.stock} left
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">Orders by status</h3>
                <BarList
                  emptyText="No orders in this period yet."
                  rows={data.statusBreakdown.map((s) => ({
                    key: s.status,
                    label: ORDER_STATUS_LABEL[s.status as OrderStatus] ?? s.status,
                    value: s.count,
                    display: s.count.toLocaleString("en-US"),
                  }))}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-900 mb-3">How customers paid</h3>
                <BarList
                  emptyText="No sales in this period yet."
                  rows={data.paymentBreakdown.map((m) => ({
                    key: m.method,
                    label: PAYMENT_METHOD_LABEL[m.method as PaymentMethod] ?? m.method,
                    value: m.revenue,
                    display: taka(m.revenue),
                    sub: `· ${m.orders} order${m.orders === 1 ? "" : "s"}`,
                  }))}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
