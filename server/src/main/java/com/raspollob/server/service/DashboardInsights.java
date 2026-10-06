package com.raspollob.server.service;

import com.raspollob.server.dto.dashboard.DashboardPeriod;
import com.raspollob.server.dto.dashboard.DashboardResponse.Attention;
import com.raspollob.server.dto.dashboard.DashboardResponse.Insight;
import com.raspollob.server.dto.dashboard.DashboardResponse.InsightLevel;
import com.raspollob.server.dto.dashboard.DashboardResponse.Metrics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Rule-based tips for the store owner. Each rule looks at one signal and, when it fires,
 * says what's happening and what to do about it. Pure logic — no database — so it's unit-tested.
 */
public final class DashboardInsights {

    static final int MAX_INSIGHTS = 5;

    /** Need at least this many orders before ratios (cancellation, repeat rate) mean anything */
    private static final long MIN_SAMPLE = 5;

    private DashboardInsights() {
    }

    public static List<Insight> build(DashboardPeriod period, Metrics current, Metrics previous,
                                      Attention attention, BigDecimal freeShippingThreshold, LocalDateTime now) {
        List<Insight> list = new ArrayList<>();
        String vs = period.previousLabel();

        // --- Operations: things blocking customers right now ---------------------
        if (attention.getOldestPendingAt() != null
                && Duration.between(attention.getOldestPendingAt(), now).toHours() >= 24) {
            list.add(new Insight("PENDING_OVERDUE", InsightLevel.CRITICAL, "Orders waiting over a day",
                    attention.getPendingOrders() + " order(s) are still pending, the oldest for "
                            + Duration.between(attention.getOldestPendingAt(), now).toDays()
                            + " day(s). Confirm them quickly — slow confirmation is the top cause of cancellations.",
                    "Review orders", "/admin/orders"));
        }
        if (attention.getOutOfStockProducts() > 0) {
            list.add(new Insight("OUT_OF_STOCK", InsightLevel.CRITICAL, "Products out of stock",
                    attention.getOutOfStockProducts() + " active product(s) have no stock, so customers can't order them. Restock or hide them.",
                    "Update stock", "/admin/products"));
        }
        if (attention.getAwaitingPaymentVerification() > 0) {
            list.add(new Insight("VERIFY_PAYMENTS", InsightLevel.WARNING, "Payments to verify",
                    attention.getAwaitingPaymentVerification() + " mobile-banking payment(s) need checking against your bKash / Nagad / Rocket statement before shipping.",
                    "Verify payments", "/admin/orders"));
        }
        long lowStockOnly = attention.getLowStockProducts().stream().filter(p -> p.getStock() > 0).count();
        if (lowStockOnly > 0) {
            list.add(new Insight("LOW_STOCK", InsightLevel.WARNING, "Running low on stock",
                    lowStockOnly + " product(s) have 5 or fewer left. Reorder now so best-sellers don't sell out.",
                    "View products", "/admin/products"));
        }
        if (attention.getUnreadMessages() > 0) {
            list.add(new Insight("UNREAD_MESSAGES", InsightLevel.WARNING, "Unanswered customer messages",
                    attention.getUnreadMessages() + " message(s) are waiting. Replying within a few hours turns questions into orders.",
                    "Open messages", "/admin/messages"));
        }

        // --- Performance vs previous period ---------------------------------------
        BigDecimal change = percentChange(current.getRevenue(), previous.getRevenue());
        if (change != null && change.compareTo(new BigDecimal("-20")) <= 0) {
            list.add(new Insight("SALES_DOWN", InsightLevel.WARNING, "Sales are down " + change.abs().toPlainString() + "%",
                    "Sales are below " + vs + " at this point. A limited-time promo code or a homepage banner for a best-seller can bring buyers back.",
                    "Create promo code", "/admin/orders"));
        } else if (change != null && change.compareTo(new BigDecimal("20")) >= 0) {
            list.add(new Insight("SALES_UP", InsightLevel.GOOD, "Sales are up " + change.toPlainString() + "%",
                    "You're ahead of " + vs + ". Check your top products' stock so the momentum doesn't stall on sold-out items.",
                    null, null));
        }

        if (current.getOrdersPlaced() >= MIN_SAMPLE) {
            double cancelRate = (double) current.getCancelledOrders() / current.getOrdersPlaced();
            if (cancelRate >= 0.15) {
                list.add(new Insight("HIGH_CANCELLATIONS", InsightLevel.WARNING, "High cancellation rate",
                        Math.round(cancelRate * 100) + "% of orders were cancelled. Call customers to confirm COD orders and check that prices and stock are accurate.",
                        "Review orders", "/admin/orders"));
            }
        }

        BigDecimal margin = current.getRevenue().signum() > 0
                ? current.getEstimatedProfit().multiply(BigDecimal.valueOf(100)).divide(current.getRevenue(), 0, RoundingMode.HALF_UP)
                : null;
        if (margin != null && current.getOrders() >= MIN_SAMPLE && margin.compareTo(BigDecimal.valueOf(15)) < 0) {
            list.add(new Insight("LOW_PROFIT", InsightLevel.WARNING, "Low profit on sales",
                    "You keep only " + margin + "% of each sale after product cost and discounts. Check your buying prices and how big your promo discounts are.",
                    "Review pricing", "/admin/products"));
        }

        // --- Growth tips -------------------------------------------------------------
        BigDecimal aov = current.getAverageOrderValue();
        if (current.getOrders() >= MIN_SAMPLE) {
            if (freeShippingThreshold == null) {
                list.add(new Insight("SET_FREE_DELIVERY", InsightLevel.TIP, "Offer free delivery to sell more per order",
                        "Your average order is ৳" + whole(aov) + ". Offering free delivery from about ৳"
                                + whole(aov.multiply(new BigDecimal("1.25"))) + " encourages customers to add one more item.",
                        "Set free delivery", "/admin/home"));
            } else if (aov.compareTo(freeShippingThreshold.multiply(new BigDecimal("0.7"))) < 0) {
                list.add(new Insight("FREE_DELIVERY_TOO_HIGH", InsightLevel.TIP, "Free delivery is hard to reach",
                        "The average order (৳" + whole(aov) + ") is far below your free-delivery amount (৳" + whole(freeShippingThreshold)
                                + "). Lowering it a little, or bundling products, can lift order size.",
                        "Adjust delivery", "/admin/home"));
            }
        }

        if (current.getUniqueBuyers() >= MIN_SAMPLE * 2) {
            double repeatRate = (double) current.getRepeatBuyers() / current.getUniqueBuyers();
            if (repeatRate < 0.2) {
                list.add(new Insight("LOW_REPEAT", InsightLevel.TIP, "Bring customers back",
                        "Only " + Math.round(repeatRate * 100) + "% of buyers had ordered before. A thank-you promo code for the next order builds repeat sales.",
                        "Create promo code", "/admin/orders"));
            }
        }

        if (attention.getActivePromoCodes() == 0) {
            list.add(new Insight("NO_PROMO", InsightLevel.TIP, "No active promo codes",
                    "A small welcome or seasonal code gives social-media posts and SMS campaigns a reason to buy now.",
                    "Create promo code", "/admin/orders"));
        }
        if (attention.getActiveProducts() > 0 && attention.getTrendingProducts() == 0) {
            list.add(new Insight("NO_TRENDING", InsightLevel.TIP, "Nothing marked as trending",
                    "The homepage Trending section is empty. Mark your best-sellers as trending to feature them.",
                    "Choose products", "/admin/products"));
        }
        if (current.getOrders() == 0 && previous.getOrders() == 0) {
            list.add(new Insight("NO_ORDERS", InsightLevel.TIP, "No orders yet",
                    "Share your product links on Facebook and in customer groups, and add a promo banner to your homepage to get the first orders in.",
                    "Edit homepage", "/admin/home"));
        }

        return list.stream()
                .sorted(Comparator.comparing(Insight::getLevel)) // CRITICAL → WARNING → TIP → GOOD
                .limit(MAX_INSIGHTS)
                .toList();
    }

    /** Whole-percent change, or null when there's no previous value to compare with. */
    static BigDecimal percentChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.signum() == 0) return null;
        return current.subtract(previous).multiply(BigDecimal.valueOf(100))
                .divide(previous, 0, RoundingMode.HALF_UP);
    }

    private static String whole(BigDecimal amount) {
        return String.format("%,d", amount.setScale(0, RoundingMode.HALF_UP).longValue());
    }
}
