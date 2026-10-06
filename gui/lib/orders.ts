import type { DeliveryZone, OrderStatus, PaymentMethod, PaymentStatus } from "@/types/order";

// Phone rules live in lib/phone; re-exported for existing imports
export { BD_PHONE_REGEX } from "./phone";

/** "৳1,250" — Taka amounts without trailing zeros. */
export function formatTaka(amount: number | null | undefined): string {
  return `৳${Number(amount ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

/** Badge classes per status (bg / text / border). */
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  CONFIRMED: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  PROCESSING: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
  SHIPPED: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  DELIVERED: "bg-[#5c8b29]/10 text-[#4a7021] border-[#5c8b29]/20",
  CANCELLED: "bg-red-500/10 text-red-700 border-red-500/20",
  RETURNED: "bg-zinc-500/10 text-zinc-700 border-zinc-500/20",
};

/** The normal delivery path, used for progress steppers. */
export const ORDER_STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING_VERIFICATION: "Verifying",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  UNPAID: "bg-zinc-500/10 text-zinc-700 border-zinc-500/20",
  PENDING_VERIFICATION: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  PAID: "bg-[#5c8b29]/10 text-[#4a7021] border-[#5c8b29]/20",
  FAILED: "bg-red-500/10 text-red-700 border-red-500/20",
  REFUNDED: "bg-sky-500/10 text-sky-700 border-sky-500/20",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  COD: "Cash on Delivery",
  BKASH: "bKash",
  NAGAD: "Nagad",
  ROCKET: "Rocket",
};

export const DELIVERY_ZONE_LABEL: Record<DeliveryZone, string> = {
  INSIDE_DHAKA: "Inside Dhaka",
  OUTSIDE_DHAKA: "Outside Dhaka",
};

export function formatAddressLines(a: { addressLine: string; area?: string; city: string; postalCode?: string }) {
  return [a.addressLine, [a.area, a.city].filter(Boolean).join(", ") + (a.postalCode ? ` - ${a.postalCode}` : "")];
}

/** Opens the printable delivery slip for an order in a new tab. */
export function openPrintSlip(orderId: number) {
  window.open(`/print/order/${orderId}`, "_blank", "noopener");
}
