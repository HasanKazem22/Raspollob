"use client";

import Link from "next/link";
import { toast } from "react-hot-toast";
import { LuCircleX, LuClock, LuCopy, LuCircleCheck } from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderBadges";
import { resolveMediaUrl } from "@/lib/api";
import {
  DELIVERY_ZONE_LABEL,
  formatAddressLines,
  formatDateTime,
  formatTaka,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/order";

function StatusProgress({ order }: { order: Order }) {
  if (order.status === "CANCELLED" || order.status === "RETURNED") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700">
        <LuCircleX className="w-5 h-5 shrink-0" />
        <p className="text-sm font-semibold">This order was {ORDER_STATUS_LABEL[order.status].toLowerCase()}.</p>
      </div>
    );
  }
  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  return (
    <ol className="grid grid-cols-5 gap-1">
      {ORDER_STATUS_FLOW.map((status, i) => {
        const done = i <= currentIndex;
        return (
          <li key={status} className="flex flex-col items-center text-center gap-1.5">
            <span
              className={cn(
                "w-full h-1.5 rounded-full",
                done ? "bg-brand" : "bg-zinc-200"
              )}
            />
            <span className={cn("text-[10px] sm:text-[11px] font-semibold", done ? "text-zinc-900" : "text-zinc-400")}>
              {ORDER_STATUS_LABEL[status]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Status updates with dates, newest first. */
function OrderTimeline({ order }: { order: Order }) {
  const entries = [...(order.history ?? [])]
    .filter((h) => h.status || h.paymentStatus)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (entries.length === 0) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-sm">
      <h2 className="text-sm font-bold text-zinc-900 mb-4">Order updates</h2>
      <ol className="relative space-y-4 border-l border-zinc-200 ml-1.5">
        {entries.map((h, i) => (
          <li key={`${h.createdAt}-${i}`} className="pl-5 relative">
            <span
              className={cn(
                "absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white",
                i === 0 ? "bg-brand" : "bg-zinc-300"
              )}
            />
            <p className={cn("text-sm font-semibold", i === 0 ? "text-zinc-900" : "text-zinc-600")}>
              {h.status
                ? ORDER_STATUS_LABEL[h.status]
                : `Payment ${PAYMENT_STATUS_LABEL[h.paymentStatus!].toLowerCase()}`}
            </p>
            <p className="text-xs text-zinc-400">{formatDateTime(h.createdAt)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Full order view for customers: status, delivery, payment, items and updates. */
export function OrderDetails({ order, justPlaced = false }: { order: Order; justPlaced?: boolean }) {
  const [addressLine, cityLine] = formatAddressLines(order.shippingAddress);
  const isOnline = order.paymentMethod !== "COD";

  return (
    <div className="space-y-6">
      {justPlaced && (
        <div className="text-center bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand/10 text-brand flex items-center justify-center mb-4">
            <LuCircleCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900">Thank you for your order!</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            {isOnline
              ? "We'll verify your payment and confirm your order shortly."
              : "We'll call you to confirm your order shortly."}
          </p>
          <p className="text-xs text-zinc-400 mt-3">
            Keep your order number. You can check this order any time on{" "}
            <Link href="/track-order" className="font-semibold text-brand-strong hover:underline">
              Track Order
            </Link>{" "}
            with the mobile number you used.
          </p>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Order Number</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-mono font-bold text-zinc-900">{order.orderNumber}</p>
              <Tooltip content="Copy order number">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(order.orderNumber);
                  toast.success("Order number copied");
                }}
                aria-label="Copy order number"
                className="p-1 rounded-md text-zinc-400 hover:text-brand cursor-pointer"
              >
                <LuCopy className="w-4 h-4" />
              </button>
              </Tooltip>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} className="text-xs px-3 py-1" />
        </div>

        <StatusProgress order={order} />

        {isOnline && order.paymentStatus === "PENDING_VERIFICATION" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-medium">
            <LuClock className="w-4 h-4 shrink-0" />
            We&apos;re verifying your {PAYMENT_METHOD_LABEL[order.paymentMethod]} payment (TrxID {order.transactionId}).
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-900 mb-3">Delivery To</h2>
          <p className="text-sm font-semibold text-zinc-900">{order.shippingAddress.fullName}</p>
          <p className="text-sm text-zinc-600">{order.shippingAddress.phone}</p>
          <p className="text-sm text-zinc-600 mt-1">{addressLine}</p>
          <p className="text-sm text-zinc-600">{cityLine}</p>
          <p className="text-xs text-zinc-400 mt-2">{DELIVERY_ZONE_LABEL[order.deliveryZone]}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-900 mb-3">Payment</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-700">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          {order.transactionId && (
            <p className="text-xs text-zinc-500 mt-2">
              TrxID <span className="font-mono">{order.transactionId}</span> · from {order.paymentSenderNumber}
            </p>
          )}
          {order.customerNote && (
            <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-100 whitespace-pre-line">
              <span className="font-semibold text-zinc-700">Your note:</span> {order.customerNote}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900 mb-3">Items ({order.itemCount})</h2>
        <ul className="divide-y divide-zinc-100">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 py-3">
              <div className="w-12 h-12 shrink-0 rounded-lg bg-zinc-50 border border-zinc-100 overflow-hidden">
                {item.imageUrl && (
                  <img src={resolveMediaUrl(item.imageUrl)} alt={item.productName} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{item.productName}</p>
                <p className="text-[11px] text-zinc-500">
                  {item.quantity} × {formatTaka(item.unitPrice)}
                </p>
              </div>
              <span className="text-sm font-bold text-zinc-900">{formatTaka(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 pt-3 border-t border-zinc-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Subtotal</dt>
            <dd className="text-zinc-900">{formatTaka(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Delivery</dt>
            <dd className="text-zinc-900">{order.shippingFee > 0 ? formatTaka(order.shippingFee) : "Free"}</dd>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-brand-strong">
              <dt>Discount {order.promoCode && <span className="font-mono">({order.promoCode})</span>}</dt>
              <dd>−{formatTaka(order.discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between items-end pt-2 border-t border-zinc-100">
            <dt className="font-bold text-zinc-900">Total</dt>
            <dd className="text-xl font-bold text-zinc-900">{formatTaka(order.total)}</dd>
          </div>
        </dl>
      </div>

      <OrderTimeline order={order} />

      <div className="text-center">
        <Link
          href="/"
          className="inline-block bg-brand hover:bg-brand-hover text-white font-bold py-3 px-8 rounded-full transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
