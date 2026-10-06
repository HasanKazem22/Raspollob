"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { LuCircleCheck, LuCopy, LuLoader, LuPackageSearch, LuCircleX, LuClock } from "react-icons/lu";
import { orderService } from "@/services/orderService";
import { resolveMediaUrl } from "@/lib/api";
import {
  BD_PHONE_REGEX,
  DELIVERY_ZONE_LABEL,
  formatAddressLines,
  formatDateTime,
  formatTaka,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
} from "@/lib/orders";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderBadges";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/order";

const CONTAINER = "container mx-auto px-4 lg:px-8 max-w-4xl";

function readPlacedOrder(orderNumber: string): Order | null {
  try {
    const raw = sessionStorage.getItem(`order:${orderNumber}`);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

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
                done ? "bg-[#5c8b29]" : "bg-zinc-200"
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

function OrderDetails({ order, justPlaced }: { order: Order; justPlaced: boolean }) {
  const [addressLine, cityLine] = formatAddressLines(order.shippingAddress);
  const isOnline = order.paymentMethod !== "COD";

  return (
    <div className="space-y-6">
      {justPlaced && (
        <div className="text-center bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#5c8b29]/10 text-[#5c8b29] flex items-center justify-center mb-4">
            <LuCircleCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900">Thank you for your order!</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            {isOnline
              ? "We'll verify your payment and confirm your order shortly."
              : "We'll call you to confirm your order shortly."}
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
                className="p-1 rounded-md text-zinc-400 hover:text-[#5c8b29] cursor-pointer"
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
            <div className="flex justify-between text-[#4a7021]">
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

      <div className="text-center">
        <Link
          href="/"
          className="inline-block bg-[#5c8b29] hover:bg-[#4a7021] text-white font-bold py-3 px-8 rounded-full transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [justPlaced, setJustPlaced] = useState(false);
  const [phone, setPhone] = useState("");
  const [isLooking, setIsLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Just placed in this tab: show it straight away
  useEffect(() => {
    const placed = readPlacedOrder(orderNumber);
    if (placed) {
      setOrder(placed);
      setJustPlaced(true);
    }
  }, [orderNumber]);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!BD_PHONE_REGEX.test(phone.trim())) {
      setLookupError("Enter the mobile number used for this order.");
      return;
    }
    setIsLooking(true);
    setLookupError(null);
    try {
      setOrder(await orderService.track(orderNumber, phone.trim()));
    } catch (err: any) {
      setLookupError(err?.message || "No order found with that order number and phone.");
    } finally {
      setIsLooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] py-10 pb-20">
      <div className={CONTAINER}>
        {order ? (
          <OrderDetails order={order} justPlaced={justPlaced} />
        ) : (
          <div className="max-w-md mx-auto bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#5c8b29]/10 text-[#5c8b29] flex items-center justify-center mb-4">
              <LuPackageSearch className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-serif font-bold text-zinc-900">Track Order</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Order <span className="font-mono font-semibold text-zinc-800">{orderNumber}</span>
            </p>
            <form onSubmit={lookup} className="mt-6 space-y-3 text-left">
              <label htmlFor="track-phone" className="text-xs font-semibold text-zinc-700">
                Mobile number used at checkout
              </label>
              <PhoneInput
                id="track-phone"
                value={phone}
                onChange={setPhone}
              />
              {lookupError && <p className="text-[11px] font-medium text-red-600">{lookupError}</p>}
              <button
                type="submit"
                disabled={isLooking}
                className="w-full h-10 rounded-full bg-[#5c8b29] hover:bg-[#4a7021] text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLooking && <LuLoader className="w-4 h-4 animate-spin" />}
                View Order
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
