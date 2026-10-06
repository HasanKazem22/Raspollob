import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from "@/lib/orders";
import type { OrderStatus, PaymentStatus } from "@/types/order";

const BASE = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap";

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return <span className={cn(BASE, ORDER_STATUS_STYLE[status], className)}>{ORDER_STATUS_LABEL[status]}</span>;
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return <span className={cn(BASE, PAYMENT_STATUS_STYLE[status], className)}>{PAYMENT_STATUS_LABEL[status]}</span>;
}
