"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LuPrinter, LuLoader } from "react-icons/lu";
import { orderService } from "@/services/orderService";
import { resolveMediaUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "@/components/ui/loader";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderBadges";
import {
  DELIVERY_ZONE_LABEL,
  formatAddressLines,
  formatDateTime,
  formatTaka,
  openPrintSlip,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/orders";
import type { Address, Order, OrderStatus, PaymentStatus } from "@/types/order";
import { PERM } from "@/lib/permissions";
import { refreshAdminCounts } from "@/components/admin/AdminCounts";

const PAYMENT_STATUSES: PaymentStatus[] = ["UNPAID", "PENDING_VERIFICATION", "PAID", "FAILED", "REFUNDED"];

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-zinc-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddressBlock({ address }: { address: Address }) {
  const [line1, line2] = formatAddressLines(address);
  return (
    <div className="text-xs text-zinc-600 space-y-0.5">
      <p className="font-semibold text-zinc-900">{address.fullName}</p>
      <p>
        <a href={`tel:${address.phone}`} className="hover:text-brand">{address.phone}</a>
        {address.email && <> · {address.email}</>}
      </p>
      <p>{line1}</p>
      <p>{line2}</p>
    </div>
  );
}

interface OrderDetailModalProps {
  orderId: number;
  onClose: () => void;
  onUpdated: (order: Order) => void;
}

export function OrderDetailModal({ orderId, onClose, onUpdated }: OrderDetailModalProps) {
  const { can } = useAuth();
  const canUpdate = can(PERM.order.update);
  const canUpdatePayment = can(PERM.order.updatePayment);
  const canPrint = can(PERM.order.printSlip);

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<unknown>(null);

  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const [nextPayment, setNextPayment] = useState<PaymentStatus | "">("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const [adminNote, setAdminNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const applyOrder = useCallback(
    (o: Order, notifyParent = true) => {
      setOrder(o);
      setAdminNote(o.adminNote ?? "");
      setNextStatus("");
      setNextPayment("");
      setStatusNote("");
      if (notifyParent) onUpdated(o);
    },
    [onUpdated]
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      applyOrder(await orderService.adminGet(orderId), false);
    } catch (err) {
      setError(err);
    }
  }, [orderId, applyOrder]);

  useEffect(() => {
    load();
  }, [load]);

  const saveStatus = async () => {
    if (!order?.id || !nextStatus) return;
    setIsSavingStatus(true);
    try {
      applyOrder(await orderService.updateStatus(order.id, nextStatus, statusNote.trim() || undefined));
      toast.success(`Order marked as ${ORDER_STATUS_LABEL[nextStatus]}`);
      refreshAdminCounts();
      setConfirmingStatus(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const requestStatusChange = () => {
    // Cancelling or returning restocks items, so ask first
    if (nextStatus === "CANCELLED" || nextStatus === "RETURNED") setConfirmingStatus(true);
    else saveStatus();
  };

  const savePayment = async () => {
    if (!order?.id || !nextPayment) return;
    setIsSavingPayment(true);
    try {
      applyOrder(await orderService.updatePayment(order.id, nextPayment));
      toast.success(`Payment marked as ${PAYMENT_STATUS_LABEL[nextPayment]}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update payment");
    } finally {
      setIsSavingPayment(false);
    }
  };

  const saveNote = async () => {
    if (!order?.id) return;
    setIsSavingNote(true);
    try {
      applyOrder(await orderService.updateAdminNote(order.id, adminNote));
      toast.success("Note saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save note");
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <>
      <Modal
        isOpen
        onOpenChange={(open) => !open && onClose()}
        title={order ? `Order ${order.orderNumber}` : "Order"}
        description={order ? `Placed ${formatDateTime(order.createdAt)}${order.customerUsername ? ` by @${order.customerUsername}` : " · Guest checkout"}` : undefined}
        size="xl"
      >
        {error ? (
          <ServerErrorCard error={error} onRetry={load} title="Failed to Load Order" />
        ) : !order ? (
          <Loader text="Loading order..." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* ── Left: items, totals, addresses ── */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} className="text-xs px-2.5" />
                <PaymentStatusBadge status={order.paymentStatus} className="text-xs px-2.5" />
                <span className="text-xs text-zinc-500">· {DELIVERY_ZONE_LABEL[order.deliveryZone]}</span>
                {canPrint && order.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPrintSlip(order.id!)}
                    className="ml-auto h-8 text-xs gap-1.5 rounded-lg"
                  >
                    <LuPrinter className="w-3.5 h-3.5" /> Print Slip
                  </Button>
                )}
              </div>

              <Card title={`Items (${order.itemCount})`}>
                <ul className="divide-y divide-zinc-100 -my-2">
                  {order.items.map((item) => (
                    <li key={item.productId} className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-zinc-50 border border-zinc-100 overflow-hidden">
                        {item.imageUrl && (
                          <img src={resolveMediaUrl(item.imageUrl)} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 line-clamp-1">{item.productName}</p>
                        <p className="text-[11px] text-zinc-400">
                          {item.sku && <span className="font-mono">#{item.sku} · </span>}
                          {item.quantity} × {formatTaka(item.unitPrice)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-zinc-900">{formatTaka(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Subtotal</dt>
                    <dd>{formatTaka(order.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Delivery</dt>
                    <dd>{order.shippingFee > 0 ? formatTaka(order.shippingFee) : "Free"}</dd>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-brand-strong">
                      <dt>Discount {order.promoCode && <span className="font-mono">({order.promoCode})</span>}</dt>
                      <dd>−{formatTaka(order.discountAmount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-zinc-100 text-sm font-bold">
                    <dt>Total</dt>
                    <dd>{formatTaka(order.total)}</dd>
                  </div>
                </dl>
              </Card>

              {order.customerNote && (
                <Card title="Customer Note">
                  <p className="text-xs text-zinc-700 whitespace-pre-line p-3 rounded-lg bg-amber-50 border border-amber-100">
                    {order.customerNote}
                  </p>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card title="Shipping Address">
                  <AddressBlock address={order.shippingAddress} />
                </Card>
                <Card title="Billing Address">
                  {order.billingSameAsShipping || !order.billingAddress ? (
                    <p className="text-xs text-zinc-500">Same as shipping address</p>
                  ) : (
                    <AddressBlock address={order.billingAddress} />
                  )}
                </Card>
              </div>
            </div>

            {/* ── Right: actions & timeline ── */}
            <div className="lg:col-span-2 space-y-4">
              <Card title="Order Status">
                {order.allowedNextStatuses && order.allowedNextStatuses.length > 0 && canUpdate ? (
                  <div className="space-y-2">
                    <Dropdown
                      options={order.allowedNextStatuses.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))}
                      value={nextStatus}
                      onChange={(v) => setNextStatus(v)}
                      placeholder="Move order to…"
                      className="w-full"
                    />
                    <Textarea
                      rows={2}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Note for the timeline (optional), e.g. courier & tracking no."
                      className="resize-none text-xs"
                    />
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={requestStatusChange}
                      disabled={!nextStatus || isSavingStatus}
                      className="w-full h-8 text-xs rounded-lg gap-1.5"
                    >
                      {isSavingStatus && <LuLoader className="w-3.5 h-3.5 animate-spin" />}
                      Update Status
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    {canUpdate ? "This order is closed — no further status changes." : "You can view this order but not change it."}
                  </p>
                )}
              </Card>

              <Card title="Payment">
                <dl className="text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Method</dt>
                    <dd className="font-semibold">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</dd>
                  </div>
                  {order.transactionId && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-zinc-500">Transaction ID</dt>
                        <dd className="font-mono font-semibold select-all">{order.transactionId}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-zinc-500">Paid from</dt>
                        <dd className="font-mono">{order.paymentSenderNumber}</dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Amount</dt>
                    <dd className="font-semibold">{formatTaka(order.total)}</dd>
                  </div>
                </dl>
                {canUpdatePayment && (
                  <div className="flex gap-2">
                    <Dropdown
                      options={PAYMENT_STATUSES.filter((s) => s !== order.paymentStatus).map((s) => ({
                        value: s,
                        label: PAYMENT_STATUS_LABEL[s],
                      }))}
                      value={nextPayment}
                      onChange={(v) => setNextPayment(v)}
                      placeholder="Mark payment as…"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={savePayment}
                      disabled={!nextPayment || isSavingPayment}
                      className="h-9 text-xs rounded-lg"
                    >
                      {isSavingPayment ? <LuLoader className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                )}
              </Card>

              <Card title="Internal Note">
                <Textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Only visible to staff"
                  className="resize-none text-xs"
                  disabled={!canUpdate}
                />
                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveNote}
                    disabled={isSavingNote || adminNote === (order.adminNote ?? "")}
                    className="mt-2 h-8 text-xs rounded-lg"
                  >
                    {isSavingNote ? <LuLoader className="w-3.5 h-3.5 animate-spin" /> : "Save Note"}
                  </Button>
                )}
              </Card>

              <Card title="Timeline">
                <ol className="relative border-l border-zinc-200 ml-1.5 space-y-3">
                  {[...order.history].reverse().map((h, i) => (
                    <li key={i} className="pl-4 relative">
                      <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-white" />
                      <div className="flex flex-wrap gap-1.5">
                        {h.status && <OrderStatusBadge status={h.status} />}
                        {h.paymentStatus && <PaymentStatusBadge status={h.paymentStatus} />}
                      </div>
                      {h.note && <p className="text-xs text-zinc-700 mt-1">{h.note}</p>}
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {formatDateTime(h.createdAt)}
                        {h.changedBy && ` · ${h.changedBy}`}
                      </p>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmingStatus}
        onOpenChange={setConfirmingStatus}
        title={nextStatus === "RETURNED" ? "Mark as Returned" : "Cancel Order"}
        message={
          nextStatus === "RETURNED"
            ? "The items will be added back to stock. This can't be undone."
            : "The items will be added back to stock and any promo code use released. This can't be undone."
        }
        confirmText={nextStatus === "RETURNED" ? "Mark Returned" : "Cancel Order"}
        onConfirm={saveStatus}
        isLoading={isSavingStatus}
      />
    </>
  );
}
