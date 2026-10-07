"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPrinter, LuShoppingBag } from "react-icons/lu";
import { orderService } from "@/services/orderService";
import { DataTable, ColumnDef } from "@/components/ui/table";
import { Dropdown } from "@/components/ui/dropdown";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { RowPrintButton, RowViewButton } from "@/components/admin/RowActionButtons";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/OrderBadges";
import { useAuth } from "@/context/AuthContext";
import {
  formatDateTime,
  formatTaka,
  MAX_SLIPS_PER_PRINT,
  openPrintSlip,
  openPrintSlips,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
} from "@/lib/orders";
import type { Order, OrderStatus, OrderSummary } from "@/types/order";
import { OrderDetailModal } from "./OrderDetailModal";
import { PERM } from "@/lib/permissions";

const PAGE_SIZE = 200;
const STATUS_FILTERS: (OrderStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export function OrdersTab() {
  const { can } = useAuth();
  const canPrint = can(PERM.order.printSlip);

  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);
  /** Orders ticked for printing their delivery slips together */
  const [selected, setSelected] = useState<Set<number | string>>(new Set());

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await orderService.adminList({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        size: PAGE_SIZE,
      });
      setOrders(page.content);
      setTotalCount(page.totalElements);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /** Keep the table row in sync after changes in the detail modal. */
  const handleOrderUpdated = (order: Order) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id ? { ...o, status: order.status, paymentStatus: order.paymentStatus } : o
      )
    );
  };

  const columns: ColumnDef<OrderSummary>[] = [
    {
      header: "Order",
      className: "w-44",
      cell: (o) => (
        <div>
          <div className="font-mono font-bold text-sm text-zinc-900">{o.orderNumber}</div>
          <div className="text-[11px] text-zinc-400">{formatDateTime(o.createdAt)}</div>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: (o) => (
        <div>
          <div className="font-semibold text-zinc-900">{o.customerName}</div>
          <div className="text-[11px] text-zinc-400">
            {o.customerPhone} · {o.city}
          </div>
        </div>
      ),
    },
    {
      header: "Items",
      className: "w-20 text-center",
      cellClassName: "text-center",
      cell: (o) => <span className="font-semibold">{o.itemCount}</span>,
    },
    {
      header: "Total",
      className: "w-28",
      cell: (o) => <span className="font-bold text-zinc-900">{formatTaka(o.total)}</span>,
    },
    {
      header: "Payment",
      className: "w-36",
      cell: (o) => (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-zinc-600">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</div>
          <PaymentStatusBadge status={o.paymentStatus} />
        </div>
      ),
    },
    {
      header: "Status",
      className: "w-28",
      cell: (o) => <OrderStatusBadge status={o.status} />,
    },
    {
      header: "Actions",
      className: "text-right pr-5 w-24",
      cellClassName: "text-right pr-5",
      cell: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          <RowViewButton onClick={() => setOpenOrderId(o.id)} title="View Order" />
          {canPrint && <RowPrintButton onClick={() => openPrintSlip(o.id)} title="Print Delivery Slip" />}
        </div>
      ),
    },
  ];

  // Only orders still in the list count (the filter may have changed since they were ticked)
  const selectedOrders = orders.filter((o) => selected.has(o.id));
  const tooMany = selectedOrders.length > MAX_SLIPS_PER_PRINT;

  if (error) {
    return (
      <div className="py-8">
        <ServerErrorCard error={error} onRetry={loadOrders} variant="inline" title="Failed to Load Orders" />
      </div>
    );
  }

  return (
    <>
      <DataTable
        data={orders}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by order no, name or phone..."
        searchFilter={(o, q) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
        }
        selectedIds={canPrint ? selected : undefined}
        onSelectionChange={canPrint ? setSelected : undefined}
        toolbarActions={
          <>
          {canPrint && selectedOrders.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openPrintSlips(selectedOrders.map((o) => o.id))}
                disabled={tooMany}
                title={tooMany ? `Select up to ${MAX_SLIPS_PER_PRINT} orders at a time` : undefined}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LuPrinter className="w-3.5 h-3.5" />
                Print slips ({selectedOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="h-9 px-3.5 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 hover:border-red-300 cursor-pointer transition-colors"
              >
                Clear
              </button>
            </div>
          )}
          <Dropdown
            options={STATUS_FILTERS.map((s) => ({ value: s, label: s === "ALL" ? "All statuses" : ORDER_STATUS_LABEL[s] }))}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            className="min-w-[150px]"
          />
          </>
        }
        emptyTitle={statusFilter === "ALL" ? "No orders yet" : `No ${ORDER_STATUS_LABEL[statusFilter].toLowerCase()} orders`}
        emptyDescription="Orders placed on the website will appear here."
        emptyIcon={LuShoppingBag}
      />

      {!isLoading && totalCount > orders.length && (
        <p className="text-[11px] text-zinc-400 text-center">
          Showing the latest {orders.length} of {totalCount} orders. Use the status filter to narrow the list.
        </p>
      )}

      {openOrderId !== null && (
        <OrderDetailModal
          orderId={openOrderId}
          onClose={() => setOpenOrderId(null)}
          onUpdated={handleOrderUpdated}
        />
      )}
    </>
  );
}
