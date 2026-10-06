"use client";

import { useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { LuPrinter, LuX } from "react-icons/lu";
import { orderService } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { useRemoteData } from "@/hooks/useRemoteData";
import { resolveMediaUrl } from "@/lib/api";
import {
  DELIVERY_ZONE_LABEL,
  formatAddressLines,
  formatDateTime,
  formatTaka,
  PAYMENT_METHOD_LABEL,
} from "@/lib/orders";
import { Loader } from "@/components/ui/loader";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import type { Order } from "@/types/order";
import { PERM } from "@/lib/permissions";

/**
 * Delivery slip sized for A6 labels (105 × 148 mm). Only #print-slip is printed;
 * everything else on the page is hidden by the print styles below.
 */
const PRINT_STYLES = `
@page { size: A6 portrait; margin: 4mm; }
@media print {
  body * { visibility: hidden !important; }
  #print-slip, #print-slip * { visibility: visible !important; }
  #print-slip { position: fixed; inset: 0; margin: 0; box-shadow: none; border: none; width: auto; }
}
`;

function amountLine(order: Order) {
  if (order.paymentStatus === "PAID") {
    return { label: `PAID · ${PAYMENT_METHOD_LABEL[order.paymentMethod]}`, amount: formatTaka(0), collect: false };
  }
  if (order.paymentMethod === "COD") {
    return { label: "CASH TO COLLECT", amount: formatTaka(order.total), collect: true };
  }
  return { label: `${PAYMENT_METHOD_LABEL[order.paymentMethod]} · verify payment`, amount: formatTaka(order.total), collect: true };
}

function DeliverySlip({ order }: { order: Order }) {
  const { config } = useStoreConfig();
  const logo = config?.storeLogo ? resolveMediaUrl(config.storeLogo) : "/RaspollobLogo_02.png";
  const [toLine1, toLine2] = formatAddressLines(order.shippingAddress);
  const payment = amountLine(order);

  return (
    <article
      id="print-slip"
      className="bg-white text-black w-[105mm] min-h-[148mm] mx-auto p-[5mm] border border-zinc-300 shadow-lg text-[10px] leading-snug font-sans flex flex-col gap-[3mm]"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b-2 border-black pb-[2mm]">
        <img src={logo} alt="Store logo" className="h-[12mm] w-auto object-contain" />
        <div className="text-right">
          <p className="text-[8px] uppercase tracking-wider text-zinc-600">Order</p>
          <p className="text-[14px] font-black font-mono tracking-wide">{order.orderNumber}</p>
          <p className="text-[8px] text-zinc-600">{formatDateTime(order.createdAt)}</p>
        </div>
      </header>

      {/* To */}
      <section className="border-2 border-black rounded-[2mm] p-[2.5mm]">
        <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Deliver To</p>
        <p className="text-[13px] font-black mt-[0.5mm]">{order.shippingAddress.fullName}</p>
        <p className="text-[13px] font-bold font-mono">{order.shippingAddress.phone}</p>
        <p className="mt-[1mm] text-[11px]">{toLine1}</p>
        <p className="text-[11px] font-semibold">{toLine2}</p>
        <p className="mt-[1mm] text-[9px] font-bold uppercase">{DELIVERY_ZONE_LABEL[order.deliveryZone]}</p>
      </section>

      {/* From */}
      <section>
        <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">From</p>
        <p className="font-bold">Raspollob</p>
        {config?.storeAddress && <p>{config.storeAddress}</p>}
        {config?.storePhone && <p className="font-mono">{config.storePhone}</p>}
      </section>

      {/* Items */}
      <section className="border-t border-dashed border-zinc-400 pt-[2mm]">
        <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 mb-[1mm]">
          Items ({order.itemCount})
        </p>
        <table className="w-full">
          <tbody>
            {order.items.map((item) => (
              <tr key={item.productId} className="align-top">
                <td className="pr-[2mm] font-bold whitespace-nowrap">{item.quantity}×</td>
                <td className="w-full">
                  {item.productName}
                  {item.sku && <span className="text-zinc-500 font-mono"> #{item.sku}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {order.customerNote && (
        <section className="border border-zinc-400 rounded-[1.5mm] p-[2mm]">
          <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Note</p>
          <p className="whitespace-pre-line">{order.customerNote}</p>
        </section>
      )}

      {/* Amount */}
      <section
        className={`mt-auto rounded-[2mm] p-[2.5mm] flex items-center justify-between ${
          payment.collect ? "bg-black text-white" : "border-2 border-black"
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wide">{payment.label}</span>
        <span className="text-[18px] font-black">{payment.collect ? payment.amount : "৳0"}</span>
      </section>

      <footer className="text-center text-[8px] text-zinc-600">
        Thank you for shopping with Raspollob
        {config?.storePhone && ` · Help: ${config.storePhone}`}
      </footer>
    </article>
  );
}

export default function PrintOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { isReady, canAccessAdmin, can } = useAuth();
  const { status: configStatus } = useStoreConfig();

  const fetchOrder = useCallback(() => orderService.adminGet(Number(id)), [id]);
  const { status, data: order, error, reload } = useRemoteData(fetchOrder);

  // Open the print dialog once, as soon as the slip is ready
  const printed = useRef(false);
  useEffect(() => {
    if (status === "success" && configStatus !== "loading" && !printed.current) {
      printed.current = true;
      // Let the logo load before printing
      setTimeout(() => window.print(), 400);
    }
  }, [status, configStatus]);

  if (!isReady) return <Loader variant="fullScreen" text="Checking access..." />;
  if (!canAccessAdmin || !can(PERM.order.printSlip)) {
    return <AccessDeniedCard title="Staff Only" description="Only staff can print delivery slips." />;
  }
  if (status === "loading") return <Loader variant="fullScreen" text="Preparing delivery slip..." />;
  if (status !== "success" || !order) {
    return (
      <div className="py-12">
        <ServerErrorCard error={error} onRetry={reload} title="Couldn't Load Order" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-100 py-8 px-4">
      <style>{PRINT_STYLES}</style>
      <div className="max-w-[105mm] mx-auto mb-4 flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">A6 delivery slip</p>
        <div className="flex gap-2">
          <button
            onClick={() => window.close()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            <LuX className="w-3.5 h-3.5" /> Close
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#5c8b29] hover:bg-[#4a7021] text-white text-xs font-bold cursor-pointer"
          >
            <LuPrinter className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>
      <DeliverySlip order={order} />
    </div>
  );
}
