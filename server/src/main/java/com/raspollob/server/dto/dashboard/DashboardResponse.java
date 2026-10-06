package com.raspollob.server.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Everything the admin dashboard shows for one period. All amounts in BDT. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private DashboardPeriod period;
    /** HOUR, DAY or MONTH */
    private String granularity;
    /** e.g. "last week" */
    private String previousLabel;
    private LocalDateTime rangeStart;
    private LocalDateTime rangeEnd;
    private LocalDateTime previousStart;
    private LocalDateTime previousEnd;
    private LocalDateTime generatedAt;

    private Metrics current;
    private Metrics previous;

    private List<SeriesPoint> series;
    private List<StatusCount> statusBreakdown;
    private List<PaymentMethodStat> paymentBreakdown;
    private List<TopProduct> topProducts;
    private Attention attention;
    private List<Insight> insights;

    /** Totals for a date range. Cancelled and returned orders don't count as sales. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Metrics {
        /** Sum of order totals (what customers paid, incl. delivery) */
        private BigDecimal revenue;
        private long orders;
        private BigDecimal averageOrderValue;
        private long itemsSold;
        /** Item revenue − item cost − discounts (delivery fees excluded) */
        private BigDecimal estimatedProfit;
        /** All orders placed, including cancelled/returned */
        private long ordersPlaced;
        private long cancelledOrders;
        /** Distinct phone numbers that bought */
        private long uniqueBuyers;
        /** Buyers who had also ordered before this range */
        private long repeatBuyers;
        /** Customer accounts registered */
        private long newCustomers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeriesPoint {
        /** Start of the bucket (hour, day or month) */
        private LocalDateTime bucketStart;
        private BigDecimal revenue;
        private long orders;
        /** Same position in the previous period */
        private BigDecimal previousRevenue;
        private long previousOrders;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StatusCount {
        private String status;
        private long count;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PaymentMethodStat {
        private String method;
        private long orders;
        private BigDecimal revenue;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TopProduct {
        private Long productId;
        private String name;
        private long quantity;
        private BigDecimal revenue;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LowStockProduct {
        private Long id;
        private String name;
        private int stock;
    }

    /** Current workload, independent of the selected period. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Attention {
        private long pendingOrders;
        private LocalDateTime oldestPendingAt;
        private long awaitingPaymentVerification;
        /** Confirmed or processing — packed and handed to the courier next */
        private long readyToShip;
        private long unreadMessages;
        private long outOfStockProducts;
        private List<LowStockProduct> lowStockProducts;
        private long activeProducts;
        private long trendingProducts;
        private long activePromoCodes;
    }

    public enum InsightLevel { CRITICAL, WARNING, TIP, GOOD }

    /** A short, actionable suggestion for the store owner. */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Insight {
        /** Stable identifier (e.g. LOW_STOCK) so clients can group or de-duplicate without parsing text */
        private String code;
        private InsightLevel level;
        private String title;
        private String message;
        private String actionLabel;
        private String actionHref;
    }
}
