"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LuLoader, LuPackageSearch } from "react-icons/lu";
import { orderService } from "@/services/orderService";
import { BD_PHONE_REGEX } from "@/lib/orders";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth } from "@/context/AuthContext";
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

export default function OrderPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [justPlaced, setJustPlaced] = useState(false);
  const [phone, setPhone] = useState("");
  const [isLooking, setIsLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const { user, isReady } = useAuth();
  /** Signed in: we first try the customer's own orders, so no phone number is needed */
  const [accountChecked, setAccountChecked] = useState(false);

  // Just placed in this tab: show it straight away
  useEffect(() => {
    const placed = readPlacedOrder(orderNumber);
    if (placed) {
      setOrder(placed);
      setJustPlaced(true);
    }
  }, [orderNumber]);

  // Signed-in customers see their own orders straight away; anyone else's falls back to the phone check
  useEffect(() => {
    if (!isReady || !user || order) return;
    let active = true;
    orderService
      .myOrder(orderNumber)
      .then((found) => {
        if (active) setOrder(found);
      })
      .catch(() => {
        // Not in this account (e.g. ordered as a guest): ask for the phone number instead
      })
      .finally(() => {
        if (active) setAccountChecked(true);
      });
    return () => {
      active = false;
    };
  }, [isReady, user, orderNumber, order]);

  const checkingAccount = !order && (!isReady || (!!user && !accountChecked));

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
    <div className="min-h-screen bg-background py-10 pb-20">
      <div className={CONTAINER}>
        {order ? (
          <OrderDetails order={order} justPlaced={justPlaced} />
        ) : checkingAccount ? (
          <div className="py-24 flex justify-center">
            <LuLoader className="w-6 h-6 animate-spin text-zinc-400" aria-label="Loading order" />
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-brand/10 text-brand flex items-center justify-center mb-4">
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
                className="w-full h-10 rounded-full bg-brand hover:bg-brand-hover text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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
