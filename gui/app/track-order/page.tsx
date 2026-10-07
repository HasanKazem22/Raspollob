"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuArrowLeft, LuLoader, LuPackageSearch } from "react-icons/lu";
import { orderService } from "@/services/orderService";
import { ApiError } from "@/lib/api";
import { BD_PHONE_REGEX } from "@/lib/orders";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { PhoneInput } from "@/components/ui/phone-input";
import { Input } from "@/components/ui/input";
import type { Order } from "@/types/order";

const CONTAINER = "container mx-auto px-4 lg:px-8 max-w-4xl";

function TrackOrder() {
  // /track-order?order=RP261007-AB3K fills in the order number (e.g. from a message to the customer)
  const initialNumber = useSearchParams().get("order") ?? "";
  const [orderNumber, setOrderNumber] = useState(initialNumber.toUpperCase());
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLooking, setIsLooking] = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const number = orderNumber.trim().toUpperCase();
    if (!number) {
      setError("Enter your order number.");
      return;
    }
    if (!BD_PHONE_REGEX.test(phone.trim())) {
      setError("Enter the 11-digit mobile number you used when ordering.");
      return;
    }
    setIsLooking(true);
    setError(null);
    try {
      setOrder(await orderService.track(number, phone.trim()));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("We couldn't find an order with that order number and mobile number. Please check both and try again.");
      } else if (err instanceof ApiError && err.status === 429) {
        setError(err.message || "Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError("We couldn't check your order right now. Please try again in a moment.");
      }
    } finally {
      setIsLooking(false);
    }
  };

  if (order) {
    return (
      <div className="min-h-screen bg-background py-10 pb-20">
        <div className={`${CONTAINER} space-y-4`}>
          <button
            type="button"
            onClick={() => setOrder(null)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline underline-offset-2 cursor-pointer"
          >
            <LuArrowLeft className="w-4 h-4" /> Track another order
          </button>
          <OrderDetails order={order} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 pb-20">
      <div className={CONTAINER}>
        <div className="max-w-md mx-auto bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-brand/10 text-brand flex items-center justify-center mb-4">
              <LuPackageSearch className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-zinc-900">Track Your Order</h1>
            <p className="text-sm text-zinc-500 mt-1.5">
              Enter your order number and the mobile number you used when ordering.
            </p>
          </div>

          <form onSubmit={lookup} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="track-order-number" className="text-xs font-semibold text-zinc-700">
                Order number
              </label>
              <Input
                id="track-order-number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. RP261007-AB3K"
                autoComplete="off"
                spellCheck={false}
                className="font-mono tracking-wide uppercase h-10"
              />
              <p className="text-[11px] text-zinc-400">Shown after you placed your order.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="track-order-phone" className="text-xs font-semibold text-zinc-700">
                Mobile number
              </label>
              <PhoneInput id="track-order-phone" value={phone} onChange={setPhone} />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLooking}
              className="w-full h-11 rounded-full bg-brand hover:bg-brand-hover text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isLooking && <LuLoader className="w-4 h-4 animate-spin" />}
              Track Order
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TrackOrder />
    </Suspense>
  );
}
