"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { LuPrinter, LuX } from "react-icons/lu";
import { orderService } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { useRemoteData } from "@/hooks/useRemoteData";
import { PERM } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { DeliverySlip } from "@/components/orders/DeliverySlip";
import type { Order } from "@/types/order";

/** A6 label printers: one slip per page. Office printers: A4 sheets with four A6 slips (2 × 2). */
type Paper = "a6" | "a4";
const PAPER_KEY = "raspollob_slip_paper";
const SLIPS_PER_A4 = 4;

/**
 * Pages have no margin and every slip is exactly A6, so a slip never spills onto a second page.
 * The slips render in a layer attached straight to <body>, so the app's scrolling layout can't clip them.
 */
function printStyles(paper: Paper) {
  return `
@page { size: ${paper === "a6" ? "105mm 148mm" : "A4 portrait"}; margin: 0; }
@media print {
  html, body { height: auto !important; overflow: visible !important; display: block !important; background: #fff !important; }
  body > *:not(.print-root) { display: none !important; }
  .print-root { position: static !important; overflow: visible !important; background: none !important; padding: 0 !important; }
  .print-toolbar { display: none !important; }
  .print-pages { gap: 0 !important; }
  .print-page { box-shadow: none !important; margin: 0 !important; break-after: page; }
  .print-page:last-child { break-after: auto; }
  .print-slip { box-shadow: none !important; }
  .print-slip, .print-exact { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
}

function readPaper(): Paper {
  try {
    return localStorage.getItem(PAPER_KEY) === "a4" ? "a4" : "a6";
  } catch {
    return "a6";
  }
}

/** "12,15,18" → [12, 15, 18] (invalid parts ignored). */
function parseIds(value: string | null): number[] {
  return (value ?? "")
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
  return groups;
}

function PrintSlips() {
  const ids = parseIds(useSearchParams().get("ids"));
  const idsKey = ids.join(",");
  const { isReady, canAccessAdmin, can } = useAuth();
  const allowed = canAccessAdmin && can(PERM.order.printSlip);

  const fetchSlips = useCallback(() => orderService.adminSlips(idsKey.split(",").map(Number)), [idsKey]);
  const { status, data: orders = [], error, reload } = useRemoteData(fetchSlips);

  // The layer is attached to <body>, which only exists in the browser; the paper choice is remembered there too
  const [mounted, setMounted] = useState(false);
  const [paper, setPaperState] = useState<Paper>("a6");
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPaperState(readPaper());
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const setPaper = (next: Paper) => {
    setPaperState(next);
    try {
      localStorage.setItem(PAPER_KEY, next);
    } catch {
      // Not remembered; fine for this print
    }
  };

  if (!isReady) return <Loader variant="fullScreen" text="Checking access..." />;
  if (!allowed) {
    return <AccessDeniedCard title="Staff Only" description="Only staff can print delivery slips." />;
  }
  if (ids.length === 0) {
    return <AccessDeniedCard title="No orders chosen" description="Pick one or more orders in Admin → Orders, then choose Print." />;
  }
  if (status === "loading") {
    return <Loader variant="fullScreen" text={ids.length > 1 ? `Preparing ${ids.length} delivery slips...` : "Preparing delivery slip..."} />;
  }
  if (status !== "success") {
    return (
      <div className="py-12">
        <ServerErrorCard error={error} onRetry={reload} title="Couldn't load the orders" />
      </div>
    );
  }
  if (!mounted) return null;

  const count = orders.length;
  const pages: Order[][] = paper === "a6" ? orders.map((o) => [o]) : chunk(orders, SLIPS_PER_A4);

  return createPortal(
    <div className="print-root fixed inset-0 z-[200] overflow-y-auto bg-zinc-100 py-6 px-4">
      <style>{printStyles(paper)}</style>

      <div className="print-toolbar sticky top-0 z-10 max-w-xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white border border-zinc-200 shadow-sm px-4 py-2.5">
        <div className="flex items-center gap-3">
          <p className="text-xs text-zinc-600">
            <span className="font-bold text-zinc-900">
              {count} {count === 1 ? "slip" : "slips"}
            </span>{" "}
            · {pages.length} {pages.length === 1 ? "page" : "pages"}
            {count < ids.length && <span className="text-amber-700"> · {ids.length - count} not found</span>}
          </p>
          <div role="radiogroup" aria-label="Paper" className="inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50">
            {(
              [
                ["a6", "A6 label"],
                ["a4", "A4 · 4 per page"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={paper === value}
                onClick={() => setPaper(value)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer",
                  paper === value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => window.close()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            <LuX className="w-3.5 h-3.5" /> Close
          </button>
          <button
            onClick={() => window.print()}
            disabled={count === 0}
            autoFocus
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            <LuPrinter className="w-3.5 h-3.5" /> {count > 1 ? `Print all ${count}` : "Print"}
          </button>
        </div>
      </div>

      <div className="print-pages flex flex-col items-center gap-6">
        {pages.map((group, i) =>
          paper === "a6" ? (
            <div key={group[0].orderNumber} className="print-page">
              <DeliverySlip order={group[0]} />
            </div>
          ) : (
            // A4 sheet: four A6 slips with light cut lines
            <div key={i} className="print-page w-[210mm] h-[297mm] bg-white shadow-lg grid grid-cols-2 grid-rows-2 overflow-hidden">
              {group.map((order) => (
                <DeliverySlip key={order.orderNumber} order={order} cutLines />
              ))}
            </div>
          )
        )}
      </div>
    </div>,
    document.body
  );
}

export default function PrintOrdersPage() {
  return (
    <Suspense fallback={<Loader variant="fullScreen" text="Preparing..." />}>
      <PrintSlips />
    </Suspense>
  );
}
