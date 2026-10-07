"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuChevronLeft, LuChevronRight, LuLoader, LuPackage } from "react-icons/lu";
import { orderService } from "@/services/orderService";
import { formatDateTime, formatTaka } from "@/lib/orders";
import { OrderStatusBadge } from "@/components/orders/OrderBadges";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderSummary } from "@/types/order";

const PAGE_SIZE = 5;

interface OrdersPage {
  page: number;
  items: OrderSummary[];
  totalPages: number;
  total: number;
}

/**
 * The signed-in customer's orders, newest first, five per page (the list never grows the page).
 * Each opens the full order with its updates timeline.
 */
export function MyOrders() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<OrdersPage | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    orderService
      .myOrders(page, PAGE_SIZE)
      .then((res) => {
        if (!active) return;
        setData({
          page,
          items: res.content,
          totalPages: Math.max(1, Math.ceil(res.totalElements / PAGE_SIZE)),
          total: res.totalElements,
        });
        setError(null);
      })
      .catch((err) => {
        if (active) setError(err);
      });
    return () => {
      active = false;
    };
  }, [page, attempt]);

  // While another page loads, keep showing the current one (dimmed)
  const isChangingPage = !!data && data.page !== page;

  return (
    <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {error && !data ? (
        <div className="p-6">
          <ServerErrorCard error={error} onRetry={() => setAttempt((n) => n + 1)} title="Couldn't load your orders" variant="inline" />
        </div>
      ) : !data ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : data.total === 0 ? (
        <div className="text-center py-12 px-6">
          <span className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
            <LuPackage className="w-6 h-6" />
          </span>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">No orders yet</p>
          <p className="text-xs text-zinc-500 mt-1">Orders you place while signed in will appear here.</p>
          <Link
            href="/"
            className="inline-flex mt-4 h-9 px-4 items-center rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-bold"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <ul
            aria-busy={isChangingPage}
            className={`divide-y divide-zinc-100 dark:divide-zinc-800 transition-opacity duration-150 ${isChangingPage ? "opacity-50" : ""}`}
          >
            {data.items.map((o) => (
              <li key={o.orderNumber}>
                <Link
                  href={`/order/${o.orderNumber}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-mono font-bold text-zinc-900 dark:text-white">{o.orderNumber}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDateTime(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} className="hidden sm:inline-flex" />
                  <span className="w-20 text-right text-sm font-bold text-zinc-900 dark:text-white tabular-nums shrink-0">
                    {formatTaka(o.total)}
                  </span>
                  <LuChevronRight className="w-4 h-4 text-zinc-300 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
              <span className="text-xs text-zinc-500 inline-flex items-center gap-1.5">
                Page {page + 1} of {data.totalPages} · {data.total} orders
                {isChangingPage && <LuLoader className="w-3 h-3 animate-spin" aria-label="Loading" />}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1 hover:border-brand disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <LuChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={page >= data.totalPages - 1}
                  className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1 hover:border-brand disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Next <LuChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
