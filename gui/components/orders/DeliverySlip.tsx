"use client";

import { useStoreConfig } from "@/context/StoreConfigContext";
import { resolveMediaUrl } from "@/lib/api";
import { DELIVERY_ZONE_LABEL, formatAddressLines, formatDateTime, formatTaka, PAYMENT_METHOD_LABEL } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/order";

/** More lines than this would push the slip past one page; the rest are summarised. */
const MAX_ITEM_LINES = 6;

function amountLine(order: Order) {
  if (order.paymentStatus === "PAID") {
    return { label: `Paid · ${PAYMENT_METHOD_LABEL[order.paymentMethod]}`, amount: formatTaka(0), collect: false };
  }
  if (order.paymentMethod === "COD") {
    return { label: "Cash to collect", amount: formatTaka(order.total), collect: true };
  }
  return { label: `${PAYMENT_METHOD_LABEL[order.paymentMethod]} · verify payment`, amount: formatTaka(order.total), collect: true };
}

/**
 * One delivery label, exactly A6 (105 × 148 mm). It never grows past that size, so each order
 * prints on exactly one A6 page (or one quarter of an A4 sheet).
 */
export function DeliverySlip({ order, cutLines = false }: { order: Order; cutLines?: boolean }) {
  const { config } = useStoreConfig();
  const logo = config?.storeLogo ? resolveMediaUrl(config.storeLogo) : "/RaspollobLogo_02.png";
  const [toLine1, toLine2] = formatAddressLines(order.shippingAddress);
  const payment = amountLine(order);
  const shownItems = order.items.slice(0, MAX_ITEM_LINES);
  const hiddenItems = order.items.length - shownItems.length;

  return (
    <article
      className={cn(
        "print-slip bg-white text-black w-[105mm] h-[148mm] box-border overflow-hidden p-[6mm] text-[12px] leading-snug font-sans flex flex-col gap-[3.5mm]",
        cutLines ? "border border-dashed border-zinc-300" : "border border-zinc-300 shadow-lg"
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-[3mm] border-b-2 border-black pb-[2.5mm] shrink-0">
        <img src={logo} alt="Store logo" className="h-[13mm] w-auto object-contain" />
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-zinc-600">Order</p>
          <p className="text-[16px] font-black font-mono tracking-wide leading-tight">{order.orderNumber}</p>
          <p className="text-[9px] text-zinc-600">{formatDateTime(order.createdAt)}</p>
        </div>
      </header>

      {/* To */}
      <section className="border-2 border-black rounded-[2mm] p-[3mm] shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Deliver to</p>
        <p className="text-[16px] font-black leading-tight mt-[0.5mm]">{order.shippingAddress.fullName}</p>
        <p className="text-[16px] font-bold font-mono leading-tight">{order.shippingAddress.phone}</p>
        <p className="mt-[1.5mm] text-[13px] line-clamp-2">{toLine1}</p>
        <p className="text-[13px] font-semibold">{toLine2}</p>
        <p className="mt-[1mm] text-[10px] font-bold uppercase">{DELIVERY_ZONE_LABEL[order.deliveryZone]}</p>
      </section>

      {/* From */}
      <section className="shrink-0 text-[11px]">
        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">From</p>
        <p className="font-bold">
          Raspollob
          {config?.storePhone && <span className="font-mono font-normal"> · {config.storePhone}</span>}
        </p>
        {config?.storeAddress && <p className="line-clamp-1">{config.storeAddress}</p>}
      </section>

      {/* Items: takes the remaining space */}
      <section className="flex-1 min-h-0 overflow-hidden border-t border-dashed border-zinc-400 pt-[2mm]">
        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-[1mm]">Items ({order.itemCount})</p>
        <table className="w-full">
          <tbody>
            {shownItems.map((item) => (
              <tr key={item.productId} className="align-top">
                <td className="pr-[2mm] font-bold whitespace-nowrap">{item.quantity}×</td>
                <td className="w-full">
                  <span className="line-clamp-1">
                    {item.productName}
                    {item.sku && <span className="text-[10px] font-mono text-zinc-500"> #{item.sku}</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hiddenItems > 0 && <p className="mt-[1mm] text-[11px] font-semibold">+ {hiddenItems} more {hiddenItems === 1 ? "item" : "items"}</p>}
        {order.customerNote && (
          <p className="mt-[1.5mm] text-[11px] line-clamp-2">
            <span className="font-bold">Note: </span>
            {order.customerNote}
          </p>
        )}
      </section>

      {/* Amount */}
      <section
        className={cn(
          "print-exact shrink-0 rounded-[2mm] px-[3mm] py-[2.5mm] flex items-center justify-between",
          payment.collect ? "bg-black text-white" : "border-2 border-black"
        )}
      >
        <span className="text-[11px] font-bold uppercase tracking-wide">{payment.label}</span>
        <span className="text-[22px] font-black leading-none">{payment.collect ? payment.amount : "৳0"}</span>
      </section>

      <footer className="shrink-0 text-center text-[9px] text-zinc-600">Thank you for shopping with Raspollob</footer>
    </article>
  );
}
