"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/** Badge numbers for the admin sidebar; null when the user can't open that page. */
export interface AdminCounts {
  newOrders: number | null;
  unreadMessages: number | null;
}

const EMPTY: AdminCounts = { newOrders: null, unreadMessages: null };
const REFRESH_EVENT = "admin-counts:refresh";
const POLL_MS = 30_000;

const AdminCountsContext = createContext<AdminCounts>(EMPTY);

/** Ask the sidebar to update its badges now (e.g. after confirming an order or reading a message). */
export function refreshAdminCounts() {
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

export function useAdminCounts() {
  return useContext(AdminCountsContext);
}

/**
 * Keeps the sidebar badges current: every 30 seconds while the tab is visible, when the tab
 * becomes visible again, and whenever refreshAdminCounts() is called.
 */
export function AdminCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<AdminCounts>(EMPTY);

  useEffect(() => {
    let active = true;
    let inFlight = false;

    const load = () => {
      if (document.hidden || inFlight) return;
      inFlight = true;
      apiFetch("/admin/notifications/counts")
        .then((res) => {
          if (active && res?.data) setCounts(res.data);
        })
        .catch(() => {
          // Keep the last numbers; the next poll tries again
        })
        .finally(() => {
          inFlight = false;
        });
    };

    load();
    const timer = window.setInterval(load, POLL_MS);
    const onVisibility = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(REFRESH_EVENT, load);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(REFRESH_EVENT, load);
    };
  }, []);

  // "(3) Raspollob" in the browser tab, so new activity is noticed from other tabs too
  const total = (counts.newOrders ?? 0) + (counts.unreadMessages ?? 0);
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\)\s*/, "");
    document.title = total > 0 ? `(${total > 99 ? "99+" : total}) ${base}` : base;
  }, [total]);
  useEffect(
    () => () => {
      document.title = document.title.replace(/^\(\d+\+?\)\s*/, "");
    },
    []
  );

  return <AdminCountsContext.Provider value={counts}>{children}</AdminCountsContext.Provider>;
}

/** Small number badge, matching the cart badge in the store navbar. */
export function CountBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-bold leading-none tabular-nums ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
