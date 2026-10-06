// Mirrors the backend order DTOs (com.raspollob.server.dto.order).

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentMethod = "COD" | "BKASH" | "NAGAD" | "ROCKET";

export type PaymentStatus = "UNPAID" | "PENDING_VERIFICATION" | "PAID" | "FAILED" | "REFUNDED";

export type DeliveryZone = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Address {
  fullName: string;
  phone: string;
  email?: string;
  addressLine: string;
  area?: string;
  city: string;
  postalCode?: string;
}

export interface CartLine {
  productId: number;
  quantity: number;
}

export interface OrderQuoteRequest {
  items: CartLine[];
  deliveryZone: DeliveryZone;
  promoCode?: string;
  phone?: string;
}

export interface OrderQuoteLine {
  productId: number;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
}

export interface OrderQuote {
  lines: OrderQuoteLine[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  promoCode?: string | null;
  promoError?: string | null;
  freeShippingThreshold?: number | null;
}

export interface CheckoutRequest {
  idempotencyKey: string;
  items: CartLine[];
  shippingAddress: Address;
  billingSameAsShipping: boolean;
  billingAddress?: Address;
  deliveryZone: DeliveryZone;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paymentSenderNumber?: string;
  promoCode?: string;
  customerNote?: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  sku?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderHistoryEntry {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** Admin view only */
  note?: string;
  /** Admin view only */
  changedBy?: string;
  createdAt: string;
}

export interface Order {
  /** Admin view only */
  id?: number;
  orderNumber: string;
  status: OrderStatus;
  /** Admin view only */
  allowedNextStatuses?: OrderStatus[];
  shippingAddress: Address;
  billingSameAsShipping: boolean;
  billingAddress?: Address;
  deliveryZone: DeliveryZone;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  paymentSenderNumber?: string;
  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  promoCode?: string;
  customerNote?: string;
  /** Admin view only */
  adminNote?: string;
  /** Admin view only */
  customerUsername?: string;
  history: OrderHistoryEntry[];
  createdAt: string;
  updatedAt?: string;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface PromoCode {
  id: number;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  perCustomerLimit: number;
  isActive: boolean;
  createdAt?: string;
}

export type PromoCodeInput = Omit<PromoCode, "id" | "usedCount" | "createdAt">;
