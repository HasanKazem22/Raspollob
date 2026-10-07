import { apiFetch, ApiResponse, Page } from "@/lib/api";
import type {
  CheckoutRequest,
  Order,
  OrderQuote,
  OrderQuoteRequest,
  OrderStatus,
  OrderSummary,
  PaymentStatus,
  PromoCode,
  PromoCodeInput,
} from "@/types/order";

export const orderService = {
  // --- Storefront --------------------------------------------------------------

  /**
   * Server-side pricing of the cart (current prices, shipping, promo).
   * Public: an expired session must never interrupt checkout with a login redirect.
   * The per-customer promo limit is still checked by phone here and by account on placeOrder.
   */
  async quote(request: OrderQuoteRequest): Promise<OrderQuote> {
    const res: ApiResponse<OrderQuote> = await apiFetch("/orders/quote", {
      method: "POST",
      requireAuth: false,
      body: JSON.stringify(request),
    });
    return res.data;
  },

  /** Sends the login token when present so the order is linked to the account. */
  async placeOrder(request: CheckoutRequest): Promise<Order> {
    const res: ApiResponse<Order> = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return res.data;
  },

  async track(orderNumber: string, phone: string): Promise<Order> {
    const params = new URLSearchParams({ orderNumber, phone });
    const res: ApiResponse<Order> = await apiFetch(`/orders/track?${params}`, { requireAuth: false });
    return res.data;
  },

  // --- Signed-in customers: their own orders ------------------------------------

  /** Orders placed while signed in to this account, newest first. */
  async myOrders(page = 0, size = 10): Promise<Page<OrderSummary>> {
    const res: ApiResponse<Page<OrderSummary>> = await apiFetch(`/account/orders?page=${page}&size=${size}`);
    return res.data;
  },

  /** One of the customer's own orders (no phone number needed). */
  async myOrder(orderNumber: string): Promise<Order> {
    const res: ApiResponse<Order> = await apiFetch(`/account/orders/${encodeURIComponent(orderNumber)}`);
    return res.data;
  },

  // --- Admin ---------------------------------------------------------------------

  async adminList(params: { status?: OrderStatus; query?: string; page?: number; size?: number } = {}): Promise<Page<OrderSummary>> {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.query) qs.set("query", params.query);
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 200));
    const res: ApiResponse<Page<OrderSummary>> = await apiFetch(`/admin/orders?${qs}`);
    return res.data;
  },

  /** Several orders at once, for printing their delivery slips together (max 50). */
  async adminSlips(ids: number[]): Promise<Order[]> {
    const res: ApiResponse<Order[]> = await apiFetch(`/admin/orders/slips?ids=${ids.join(",")}`);
    return res.data;
  },

  async adminGet(id: number): Promise<Order> {
    const res: ApiResponse<Order> = await apiFetch(`/admin/orders/${id}`);
    return res.data;
  },

  async updateStatus(id: number, status: OrderStatus, note?: string): Promise<Order> {
    const res: ApiResponse<Order> = await apiFetch(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    });
    return res.data;
  },

  async updatePayment(id: number, paymentStatus: PaymentStatus, note?: string): Promise<Order> {
    const res: ApiResponse<Order> = await apiFetch(`/admin/orders/${id}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus, note }),
    });
    return res.data;
  },

  async updateAdminNote(id: number, adminNote: string): Promise<Order> {
    const res: ApiResponse<Order> = await apiFetch(`/admin/orders/${id}/note`, {
      method: "PATCH",
      body: JSON.stringify({ adminNote }),
    });
    return res.data;
  },

  // --- Admin: promo codes ------------------------------------------------------------

  async listPromoCodes(): Promise<PromoCode[]> {
    const res: ApiResponse<PromoCode[]> = await apiFetch("/admin/promo-codes");
    return res.data ?? [];
  },

  async createPromoCode(input: PromoCodeInput): Promise<PromoCode> {
    const res: ApiResponse<PromoCode> = await apiFetch("/admin/promo-codes", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async updatePromoCode(id: number, input: PromoCodeInput): Promise<PromoCode> {
    const res: ApiResponse<PromoCode> = await apiFetch(`/admin/promo-codes/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async deletePromoCode(id: number): Promise<void> {
    await apiFetch(`/admin/promo-codes/${id}`, { method: "DELETE" });
  },
};
