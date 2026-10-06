"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  LuArrowLeft,
  LuBanknote,
  LuCheck,
  LuCircleAlert,
  LuCopy,
  LuLoader,
  LuLock,
  LuShoppingCart,
  LuTag,
  LuTrash2,
  LuTruck,
  LuX,
} from "react-icons/lu";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useStoreConfig } from "@/context/StoreConfigContext";
import { orderService } from "@/services/orderService";
import { resolveMediaUrl } from "@/lib/api";
import { BD_PHONE_REGEX, DELIVERY_ZONE_LABEL, formatTaka, PAYMENT_METHOD_LABEL } from "@/lib/orders";
import { BD_PHONE_ERROR } from "@/lib/phone";
import { AddressFields, AddressErrors, EMPTY_ADDRESS, validateAddress } from "@/components/orders/AddressFields";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "@/components/ui/loader";
import { ServerErrorCard } from "@/components/ui/ServerErrorCard";
import { cn } from "@/lib/utils";
import { QuantityAdjuster } from "@/components/shop/QuantityAdjuster";
import type { Address, DeliveryZone, OrderQuote, PaymentMethod } from "@/types/order";
import { PERM } from "@/lib/permissions";

const SAVED_ADDRESS_KEY = "checkout_address_v1";
const CONTAINER = "container mx-auto px-4 lg:px-8 xl:px-12 max-w-7xl";

/** Brand chip for each payment method. */
const METHOD_STYLE: Record<PaymentMethod, { short: string; className: string }> = {
  COD: { short: "", className: "bg-[#5c8b29]/10 text-[#5c8b29]" },
  BKASH: { short: "bK", className: "bg-[#e2136e] text-white" },
  NAGAD: { short: "N", className: "bg-[#f6921e] text-white" },
  ROCKET: { short: "R", className: "bg-[#8c3494] text-white" },
};

interface CheckoutErrors {
  shipping?: AddressErrors;
  billing?: AddressErrors;
  paymentMethod?: string;
  transactionId?: string;
  senderNumber?: string;
}

function hasErrors(errors: CheckoutErrors) {
  return (
    Object.keys(errors.shipping ?? {}).length > 0 ||
    Object.keys(errors.billing ?? {}).length > 0 ||
    !!errors.paymentMethod ||
    !!errors.transactionId ||
    !!errors.senderNumber
  );
}

function Section({
  id,
  step,
  title,
  description,
  children,
}: {
  id: string;
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-sm scroll-mt-28">
      <header className="flex items-start gap-3 mb-5">
        <span className="w-7 h-7 shrink-0 rounded-full bg-[#5c8b29] text-white text-xs font-bold flex items-center justify-center">
          {step}
        </span>
        <div>
          <h2 className="text-lg font-serif font-bold text-zinc-900 leading-tight">{title}</h2>
          {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function OptionCard({
  selected,
  onSelect,
  title,
  subtitle,
  icon,
  trailing,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-50",
        selected
          ? "border-[#5c8b29] bg-[#5c8b29]/[0.04] ring-1 ring-[#5c8b29]"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      )}
    >
      <span
        className={cn(
          "w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center",
          selected ? "border-[#5c8b29]" : "border-zinc-300"
        )}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-[#5c8b29]" />}
      </span>
      {icon}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-zinc-900">{title}</span>
        {subtitle && <span className="block text-[11px] text-zinc-500">{subtitle}</span>}
      </span>
      {trailing}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-[11px] font-medium text-red-600">{message}</p> : null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartCount, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user, can, isReady } = useAuth();
  // Guests may check out unless the store turned that off for the GUEST role
  const canPlaceOrder = can(PERM.storefront.placeOrder);
  const { config, status: configStatus, refresh: refreshConfig } = useStoreConfig();

  // One key per visit to this page: retries and double clicks can't create two orders
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [shipping, setShipping] = useState<Address>(EMPTY_ADDRESS);
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<Address>(EMPTY_ADDRESS);
  const [zone, setZone] = useState<DeliveryZone>("INSIDE_DHAKA");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [note, setNote] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [quote, setQuote] = useState<OrderQuote | null>(null);
  /** Inputs the shown quote was priced for; differs from the live inputs while re-pricing */
  const [quotedFor, setQuotedFor] = useState("");
  const [quoteFailed, setQuoteFailed] = useState(false);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // --- Prefill: last used address, otherwise the signed-in user's profile -------
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    try {
      const saved = localStorage.getItem(SAVED_ADDRESS_KEY);
      if (saved) {
        setShipping({ ...EMPTY_ADDRESS, ...JSON.parse(saved) });
        prefilled.current = true;
        return;
      }
    } catch {
      // Ignore unreadable saved address
    }
    if (user) {
      setShipping((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || "",
        phone: prev.phone || user.mobile || "",
        email: prev.email || user.email || "",
        addressLine: prev.addressLine || user.address || "",
        city: prev.city || user.city || "",
      }));
      prefilled.current = true;
    }
  }, [user]);

  // --- Payment methods enabled in admin settings --------------------------------
  const methods = useMemo(() => {
    const list: { id: PaymentMethod; number?: string }[] = [];
    if (config?.codEnabled !== false) list.push({ id: "COD" });
    if (config?.bkashNumber) list.push({ id: "BKASH", number: config.bkashNumber });
    if (config?.nagadNumber) list.push({ id: "NAGAD", number: config.nagadNumber });
    if (config?.rocketNumber) list.push({ id: "ROCKET", number: config.rocketNumber });
    return list;
  }, [config]);

  useEffect(() => {
    if (!paymentMethod && methods.length > 0) setPaymentMethod(methods[0].id);
  }, [methods, paymentMethod]);

  const selectedMethod = methods.find((m) => m.id === paymentMethod);
  const isOnlinePayment = !!paymentMethod && paymentMethod !== "COD";

  // --- Server quote (re-priced on every relevant change) ------------------------
  const lines = useMemo(
    () =>
      cartItems
        .map((item) => ({ productId: Number(item.id), quantity: item.quantity }))
        .filter((l) => Number.isFinite(l.productId)),
    [cartItems]
  );
  const promoPhone = BD_PHONE_REGEX.test(shipping.phone.trim()) ? shipping.phone.trim() : undefined;

  const quoteInputs = JSON.stringify({ lines, zone, promoCode, promoPhone });
  // Old totals stay visible (dimmed) while the server re-prices: no jumps, no skeleton flash
  const isRepricing = !!quote && quotedFor !== quoteInputs && !quoteFailed;

  useEffect(() => {
    if (lines.length === 0) return;
    let active = true;
    const pricedFor = JSON.stringify({ lines, zone, promoCode, promoPhone });
    const timer = setTimeout(() => {
      orderService
        .quote({ items: lines, deliveryZone: zone, promoCode: promoCode ?? undefined, phone: promoPhone })
        .then((q) => {
          if (!active) return;
          setQuote(q);
          setQuotedFor(pricedFor);
          setQuoteFailed(false);
          if (promoCode && q.promoError) {
            setPromoError(q.promoError);
            setPromoCode(null);
          }
        })
        .catch(() => active && setQuoteFailed(true));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [lines, zone, promoCode, promoPhone]);

  const isApplyingPromo = !!promoCode && quote?.promoCode !== promoCode;
  const appliedPromo = promoCode && quote?.promoCode === promoCode ? promoCode : null;

  // Cart lines the server can't fulfil (inactive product or not enough stock)
  const stockIssues = useMemo(() => {
    if (!quote) return {} as Record<string, string>;
    const issues: Record<string, string> = {};
    for (const item of cartItems) {
      const line = quote.lines.find((l) => String(l.productId) === item.id);
      if (!line) issues[item.id] = "No longer available — please remove it";
      else if (line.availableStock <= 0) issues[item.id] = "Out of stock";
      else if (item.quantity > line.availableStock) issues[item.id] = `Only ${line.availableStock} left`;
    }
    return issues;
  }, [quote, cartItems]);
  const hasStockIssues = Object.keys(stockIssues).length > 0;

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    setPromoCode(code);
  };

  const removePromo = () => {
    setPromoCode(null);
    setPromoInput("");
    setPromoError(null);
  };

  // --- Submit -----------------------------------------------------------------
  const validate = (): CheckoutErrors => {
    const next: CheckoutErrors = {
      shipping: validateAddress(shipping),
      billing: billingSame ? {} : validateAddress(billing),
    };
    if (!paymentMethod) next.paymentMethod = "Choose a payment method";
    if (isOnlinePayment) {
      if (!senderNumber.trim()) next.senderNumber = "Enter the number you paid from";
      else if (!BD_PHONE_REGEX.test(senderNumber.trim())) next.senderNumber = BD_PHONE_ERROR;
      if (transactionId.trim().length < 6) next.transactionId = "Enter the transaction ID from your payment SMS";
    }
    return next;
  };

  const placeOrder = async () => {
    if (!canPlaceOrder) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      const firstSection = Object.keys(nextErrors.shipping ?? {}).length
        ? "shipping"
        : Object.keys(nextErrors.billing ?? {}).length
          ? "billing"
          : "payment";
      document.getElementById(firstSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast.error("Please check the highlighted fields.");
      return;
    }
    if (!paymentMethod) return;

    setIsPlacing(true);
    setSubmitError(null);
    try {
      const order = await orderService.placeOrder({
        idempotencyKey,
        items: lines,
        shippingAddress: shipping,
        billingSameAsShipping: billingSame,
        billingAddress: billingSame ? undefined : billing,
        deliveryZone: zone,
        paymentMethod,
        transactionId: isOnlinePayment ? transactionId.trim() : undefined,
        paymentSenderNumber: isOnlinePayment ? senderNumber.trim() : undefined,
        promoCode: appliedPromo ?? undefined,
        customerNote: note.trim() || undefined,
      });

      try {
        localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(shipping));
        sessionStorage.setItem(`order:${order.orderNumber}`, JSON.stringify(order));
      } catch {
        // Storage unavailable (private mode) — the order page can still look it up
      }
      setIsRedirecting(true);
      clearCart();
      router.replace(`/order/${order.orderNumber}`);
    } catch (err: any) {
      const message = err?.message || "Could not place your order. Please try again.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsPlacing(false);
    }
  };

  // --- Render -----------------------------------------------------------------
  if (isRedirecting) {
    return <Loader variant="fullScreen" text="Order placed! Opening your order…" />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#FDFBF9] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-6 text-zinc-400">
          <LuShoppingCart className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-zinc-900 mb-3">Your cart is empty</h1>
        <p className="text-zinc-500 mb-8 max-w-sm">Add some products before checking out.</p>
        <Link
          href="/"
          className="bg-[#5c8b29] hover:bg-[#4a7021] text-white font-bold py-3 px-8 rounded-full transition-colors"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  if (configStatus === "loading") {
    return <Loader variant="fullScreen" text="Preparing checkout…" />;
  }

  if (configStatus !== "success") {
    return (
      <div className="min-h-[60vh] bg-[#FDFBF9] py-12">
        <ServerErrorCard onRetry={refreshConfig} title="Checkout is unavailable" description="We couldn't reach the store. Please try again in a moment." />
      </div>
    );
  }

  const insideFee = config?.shippingFeeInsideDhaka ?? 60;
  const outsideFee = config?.shippingFeeOutsideDhaka ?? 120;
  const isFreeShipping = quote ? quote.shippingFee === 0 : false;
  const amountForFreeShipping =
    quote?.freeShippingThreshold && quote.subtotal < quote.freeShippingThreshold
      ? quote.freeShippingThreshold - quote.subtotal
      : 0;

  return (
    <div className="min-h-screen bg-[#FDFBF9] pb-20">
      <div className={`${CONTAINER} pt-10 pb-6 flex flex-wrap items-end justify-between gap-4`}>
        <div>
          <h1 className="text-3xl font-serif font-bold text-zinc-900">Cart & Checkout</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {user
              ? `Signed in as ${user.fullName || user.username}`
              : canPlaceOrder
                ? "Checking out as a guest — no account needed."
                : "Sign in to place your order."}
          </p>
        </div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5c8b29] hover:gap-2.5 transition-all">
          <LuArrowLeft className="w-4 h-4" /> Continue shopping
        </Link>
      </div>

      <div className={CONTAINER}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left: form ── */}
          <div className="lg:col-span-7 space-y-6">
            <Section
              id="cart"
              step={1}
              title="Your Cart"
              description={`${cartCount} item${cartCount === 1 ? "" : "s"} · change quantities or remove items here`}
            >
              <ul className="divide-y divide-zinc-100">
                {cartItems.map((item) => {
                  const line = quote?.lines.find((l) => String(l.productId) === item.id);
                  const unitPrice = line?.unitPrice ?? item.price;
                  const issue = stockIssues[item.id];
                  const atStockLimit = !!line && item.quantity >= line.availableStock;
                  return (
                    <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <Link
                        href={`/product/${item.id}`}
                        className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden group"
                      >
                        {item.imageUrl ? (
                          <img
                            src={resolveMediaUrl(item.imageUrl)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-300">
                            Raspollob
                          </span>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                              {item.categoryName || "Raspollob"}
                            </p>
                            <Link
                              href={`/product/${item.id}`}
                              className="font-serif font-bold text-zinc-900 leading-snug hover:text-[#5c8b29] transition-colors line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            <p className="text-xs text-zinc-500 mt-0.5">{formatTaka(unitPrice)} each</p>
                          </div>
                          <Tooltip content="Remove from cart">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            disabled={isPlacing}
                            aria-label={`Remove ${item.name}`}
                            className="shrink-0 p-2 -mr-2 -mt-1 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <LuTrash2 className="w-4 h-4" />
                          </button>
                          </Tooltip>
                        </div>

                        <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                          <QuantityAdjuster
                            quantity={item.quantity}
                            onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                            onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                            disableDecrease={item.quantity <= 1 || isPlacing}
                            disableIncrease={atStockLimit || isPlacing}
                            className="h-9 w-[110px] rounded-full border border-zinc-200 bg-white px-1"
                            buttonClassName="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-[#5c8b29] transition-colors cursor-pointer"
                            textClassName="font-bold text-sm text-zinc-900 flex-1 text-center tabular-nums"
                            iconClassName="w-3.5 h-3.5"
                          />
                          <span className="text-base font-bold text-zinc-900 tabular-nums">
                            {formatTaka(line?.lineTotal ?? unitPrice * item.quantity)}
                          </span>
                        </div>

                        {issue && (
                          <p className="mt-2 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                            <LuCircleAlert className="w-3 h-3" /> {issue}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>

            <Section id="shipping" step={2} title="Shipping Address" description="Where should we deliver your order?">
              <AddressFields idPrefix="ship" value={shipping} onChange={setShipping} errors={errors.shipping} disabled={isPlacing} />

              <div className="mt-6">
                <p className="text-xs font-semibold text-zinc-700 mb-2">Delivery Area</p>
                <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(["INSIDE_DHAKA", "OUTSIDE_DHAKA"] as DeliveryZone[]).map((z) => (
                    <OptionCard
                      key={z}
                      selected={zone === z}
                      onSelect={() => setZone(z)}
                      title={DELIVERY_ZONE_LABEL[z]}
                      subtitle={z === "INSIDE_DHAKA" ? "1–2 business days" : "2–4 business days"}
                      icon={<LuTruck className="w-4 h-4 text-zinc-400" />}
                      trailing={
                        <span className="text-sm font-bold text-zinc-900">
                          {isFreeShipping ? "Free" : formatTaka(z === "INSIDE_DHAKA" ? insideFee : outsideFee)}
                        </span>
                      }
                      disabled={isPlacing}
                    />
                  ))}
                </div>
              </div>
            </Section>

            <Section id="billing" step={3} title="Billing Address">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={billingSame}
                  onChange={(e) => setBillingSame(e.target.checked)}
                  disabled={isPlacing}
                  className="w-4 h-4 accent-[#5c8b29]"
                />
                <span className="text-sm font-semibold text-zinc-800">Same as shipping address</span>
              </label>
              {!billingSame && (
                <div className="mt-5">
                  <AddressFields idPrefix="bill" value={billing} onChange={setBilling} errors={errors.billing} disabled={isPlacing} />
                </div>
              )}
            </Section>

            <Section id="payment" step={4} title="Payment Method" description="All payments are verified by our team before shipping.">
              {methods.length === 0 ? (
                <p className="text-sm text-red-600">No payment method is available right now. Please contact us to order.</p>
              ) : (
                <div role="radiogroup" className="space-y-3">
                  {methods.map((m) => (
                    <OptionCard
                      key={m.id}
                      selected={paymentMethod === m.id}
                      onSelect={() => setPaymentMethod(m.id)}
                      title={PAYMENT_METHOD_LABEL[m.id]}
                      subtitle={m.id === "COD" ? "Pay in cash when your order arrives" : "Send money first, then enter the transaction ID"}
                      icon={
                        <span className={cn("w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-black", METHOD_STYLE[m.id].className)}>
                          {m.id === "COD" ? <LuBanknote className="w-4 h-4" /> : METHOD_STYLE[m.id].short}
                        </span>
                      }
                      disabled={isPlacing}
                    />
                  ))}
                </div>
              )}
              <FieldError message={errors.paymentMethod} />

              {isOnlinePayment && selectedMethod?.number && (
                <div className="mt-5 p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-4">
                  <ol className="text-sm text-zinc-700 space-y-1.5 list-decimal pl-5">
                    <li>
                      Open {PAYMENT_METHOD_LABEL[selectedMethod.id]} and send{" "}
                      <strong className="text-zinc-900">{quote ? formatTaka(quote.total) : "the order total"}</strong> to:
                    </li>
                  </ol>
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-zinc-200">
                    <span className="font-mono text-lg font-bold tracking-wider text-zinc-900">{selectedMethod.number}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedMethod.number ?? "");
                        toast.success("Number copied");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#5c8b29] hover:underline cursor-pointer"
                    >
                      <LuCopy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                  {config?.paymentInstructions && (
                    <p className="text-xs text-zinc-500 whitespace-pre-line leading-relaxed">{config.paymentInstructions}</p>
                  )}
                  <ol start={2} className="text-sm text-zinc-700 list-decimal pl-5">
                    <li>Enter your payment details below:</li>
                  </ol>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Paid From (Mobile Number)" required htmlFor="senderNumber">
                      <PhoneInput
                        id="senderNumber"
                        value={senderNumber}
                        onChange={setSenderNumber}
                        disabled={isPlacing}
                        className={errors.senderNumber ? "border-red-400" : ""}
                      />
                      <FieldError message={errors.senderNumber} />
                    </FormField>
                    <FormField label="Transaction ID" required htmlFor="transactionId">
                      <Input
                        id="transactionId"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                        placeholder="e.g. 9A7B3C2D1E"
                        autoComplete="off"
                        disabled={isPlacing}
                        className={cn("font-mono uppercase", errors.transactionId && "border-red-400")}
                      />
                      <FieldError message={errors.transactionId} />
                    </FormField>
                  </div>
                </div>
              )}
            </Section>

            <Section id="notes" step={5} title="Special Notes" description="Optional — delivery instructions, gift message, preferred time…">
              <Textarea
                rows={3}
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Please call before delivery"
                disabled={isPlacing}
                className="resize-none"
              />
              <p className="mt-1 text-right text-[11px] text-zinc-400">{note.length}/1000</p>
            </Section>
          </div>

          {/* ── Right: order summary ── */}
          <aside className="lg:col-span-5 lg:sticky lg:top-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-serif font-bold text-zinc-900">Order Summary</h2>
                {/* Compact preview — items are edited in "Your Cart" */}
                <a href="#cart" className="mt-3 flex items-center gap-3 group">
                  <span className="flex -space-x-3">
                    {cartItems.slice(0, 4).map((item) => (
                      <span
                        key={item.id}
                        className="w-11 h-11 rounded-xl bg-zinc-50 border-2 border-white ring-1 ring-zinc-200 overflow-hidden"
                      >
                        {item.imageUrl && (
                          <img src={resolveMediaUrl(item.imageUrl)} alt="" className="w-full h-full object-cover" />
                        )}
                      </span>
                    ))}
                    {cartItems.length > 4 && (
                      <span className="w-11 h-11 rounded-xl bg-zinc-100 border-2 border-white ring-1 ring-zinc-200 flex items-center justify-center text-[11px] font-bold text-zinc-600">
                        +{cartItems.length - 4}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-zinc-500 group-hover:text-[#5c8b29] transition-colors">
                    {cartCount} item{cartCount === 1 ? "" : "s"}
                    {hasStockIssues && <span className="block font-semibold text-red-600">Check your cart</span>}
                  </span>
                </a>
              </div>

              {/* Promo code */}
              <div className="pt-4 border-t border-zinc-100">
                {appliedPromo ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[#5c8b29]/[0.06] border border-[#5c8b29]/20">
                    <span className="flex items-center gap-2 text-sm">
                      <LuTag className="w-4 h-4 text-[#5c8b29]" />
                      <span className="font-mono font-bold text-zinc-900">{appliedPromo}</span>
                      <span className="text-[#4a7021] font-semibold">−{formatTaka(quote?.discountAmount)}</span>
                    </span>
                    <Tooltip content="Remove code">
                    <button
                      type="button"
                      onClick={removePromo}
                      aria-label="Remove promo code"
                      className="p-1 rounded-md text-zinc-500 hover:bg-white hover:text-red-600 cursor-pointer"
                      disabled={isPlacing}
                    >
                      <LuX className="w-4 h-4" />
                    </button>
                    </Tooltip>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      applyPromo();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        setPromoError(null);
                      }}
                      placeholder="Promo code"
                      aria-label="Promo code"
                      className="font-mono uppercase"
                      disabled={isPlacing || isApplyingPromo}
                    />
                    <button
                      type="submit"
                      disabled={!promoInput.trim() || isApplyingPromo || isPlacing}
                      className="shrink-0 h-9 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isApplyingPromo ? <LuLoader className="w-4 h-4 animate-spin" /> : "Apply"}
                    </button>
                  </form>
                )}
                {promoError && <FieldError message={promoError} />}
              </div>

              {/* Totals */}
              <dl
                aria-busy={isRepricing}
                className={`pt-4 border-t border-zinc-100 space-y-2.5 text-sm transition-opacity duration-200 ${
                  isRepricing ? "opacity-60" : ""
                }`}
              >
                {!quote ? (
                  quoteFailed ? (
                    <p className="text-sm text-red-600">Couldn&apos;t calculate the total. Check your connection.</p>
                  ) : (
                    <>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-6 w-full mt-3" />
                    </>
                  )
                ) : (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Subtotal</dt>
                      <dd className="font-semibold text-zinc-900">{formatTaka(quote.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Delivery ({DELIVERY_ZONE_LABEL[zone]})</dt>
                      <dd className="font-semibold text-zinc-900">{isFreeShipping ? "Free" : formatTaka(quote.shippingFee)}</dd>
                    </div>
                    {quote.discountAmount > 0 && (
                      <div className="flex justify-between text-[#4a7021]">
                        <dt>Discount</dt>
                        <dd className="font-semibold">−{formatTaka(quote.discountAmount)}</dd>
                      </div>
                    )}
                    {amountForFreeShipping > 0 && (
                      <p className="text-[11px] text-zinc-400">
                        Add {formatTaka(amountForFreeShipping)} more for free delivery.
                      </p>
                    )}
                    <div className="flex justify-between items-end pt-3 border-t border-zinc-100">
                      <dt className="font-bold text-zinc-900 flex items-center gap-1.5">
                        Total
                        {isRepricing && <LuLoader className="w-3.5 h-3.5 animate-spin text-zinc-400" aria-label="Updating total" />}
                      </dt>
                      <dd className="text-2xl font-bold text-zinc-900">{formatTaka(quote.total)}</dd>
                    </div>
                  </>
                )}
              </dl>

              {submitError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium">
                  <LuCircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {isReady && !canPlaceOrder && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-medium">
                  <LuLock className="w-4 h-4 shrink-0 mt-0.5" />
                  {user ? (
                    <span>Your account can&apos;t place orders right now. Please contact the store.</span>
                  ) : (
                    <span>
                      Please{" "}
                      <Link href="/login?next=/checkout" className="font-bold underline">
                        sign in
                      </Link>{" "}
                      to place your order. Your cart will be kept.
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={placeOrder}
                disabled={isPlacing || !quote || isRepricing || hasStockIssues || methods.length === 0 || !canPlaceOrder}
                className="w-full bg-[#5c8b29] hover:bg-[#4a7021] text-white font-bold py-4 rounded-full shadow-lg shadow-[#5c8b29]/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPlacing ? (
                  <>
                    <LuLoader className="w-5 h-5 animate-spin" /> Placing order…
                  </>
                ) : (
                  <>
                    <LuCheck className="w-5 h-5" />
                    {isOnlinePayment ? "Confirm Payment & Place Order" : "Place Order"}
                    {quote && ` · ${formatTaka(quote.total)}`}
                  </>
                )}
              </button>
              {hasStockIssues && (
                <p className="text-[11px] text-center text-red-600">Update your cart to continue.</p>
              )}
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
                <LuLock className="w-3 h-3" /> Prices and stock are confirmed when you place the order.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
