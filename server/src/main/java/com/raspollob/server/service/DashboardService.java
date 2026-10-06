package com.raspollob.server.service;

import com.raspollob.server.dto.dashboard.DashboardPeriod;
import com.raspollob.server.dto.dashboard.DashboardResponse;
import com.raspollob.server.dto.dashboard.DashboardResponse.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * Aggregates sales data for the admin dashboard. All heavy lifting is done in PostgreSQL
 * (one query per figure) so it stays fast as the order table grows.
 * Times are server-local, matching how order timestamps are stored.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    /** Orders in these states are not sales */
    private static final String VALID_ORDER = "status NOT IN ('CANCELLED', 'RETURNED')";
    private static final int LOW_STOCK_THRESHOLD = 5;

    private final JdbcTemplate jdbc;
    private final StoreConfigService storeConfigService;

    record Range(LocalDateTime start, LocalDateTime end) {
        Timestamp startTs() { return Timestamp.valueOf(start); }
        Timestamp endTs() { return Timestamp.valueOf(end); }
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(DashboardPeriod period) {
        LocalDateTime now = LocalDateTime.now();
        Range current = new Range(periodStart(period, now), now);
        Range previous = previousRange(period, current);

        Metrics currentMetrics = metrics(current);
        Metrics previousMetrics = metrics(previous);
        Attention attention = attention();

        List<Insight> insights = DashboardInsights.build(
                period, currentMetrics, previousMetrics, attention,
                StoreConfigService.freeShippingThreshold(storeConfigService.loadConfig()), now);

        return DashboardResponse.builder()
                .period(period)
                .granularity(period.granularity())
                .previousLabel(period.previousLabel())
                .rangeStart(current.start())
                .rangeEnd(current.end())
                .previousStart(previous.start())
                .previousEnd(previous.end())
                .generatedAt(now)
                .current(currentMetrics)
                .previous(previousMetrics)
                .series(series(period, current, previous))
                .statusBreakdown(statusBreakdown(current))
                .paymentBreakdown(paymentBreakdown(current))
                .topProducts(topProducts(current))
                .attention(attention)
                .insights(insights)
                .build();
    }

    // =========================================================================
    // Ranges
    // =========================================================================

    static LocalDateTime periodStart(DashboardPeriod period, LocalDateTime now) {
        LocalDate today = now.toLocalDate();
        return switch (period) {
            case TODAY -> today.atStartOfDay();
            case WEEK -> today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
            case MONTH -> today.withDayOfMonth(1).atStartOfDay();
            case YEAR -> today.withDayOfYear(1).atStartOfDay();
        };
    }

    /** Same elapsed span, one period earlier (e.g. Mar 1–5 → Feb 1–5), never overlapping the current range. */
    static Range previousRange(DashboardPeriod period, Range current) {
        LocalDateTime prevStart = switch (period) {
            case TODAY -> current.start().minusDays(1);
            case WEEK -> current.start().minusWeeks(1);
            case MONTH -> current.start().minusMonths(1);
            case YEAR -> current.start().minusYears(1);
        };
        LocalDateTime prevEnd = prevStart.plus(Duration.between(current.start(), current.end()));
        return new Range(prevStart, prevEnd.isAfter(current.start()) ? current.start() : prevEnd);
    }

    private static LocalDateTime plusBuckets(DashboardPeriod period, LocalDateTime start, long n) {
        return switch (period.granularity()) {
            case "HOUR" -> start.plusHours(n);
            case "DAY" -> start.plusDays(n);
            default -> start.plusMonths(n);
        };
    }

    private static LocalDateTime truncate(DashboardPeriod period, LocalDateTime t) {
        return switch (period.granularity()) {
            case "HOUR" -> t.truncatedTo(ChronoUnit.HOURS);
            case "DAY" -> t.truncatedTo(ChronoUnit.DAYS);
            default -> t.toLocalDate().withDayOfMonth(1).atStartOfDay();
        };
    }

    // =========================================================================
    // Queries
    // =========================================================================

    private Metrics metrics(Range r) {
        Map<String, Object> totals = jdbc.queryForMap(
                "SELECT COUNT(*) FILTER (WHERE " + VALID_ORDER + ") AS orders, " +
                "COALESCE(SUM(total) FILTER (WHERE " + VALID_ORDER + "), 0) AS revenue, " +
                "COALESCE(SUM(item_count) FILTER (WHERE " + VALID_ORDER + "), 0) AS items, " +
                "COALESCE(SUM(discount_amount) FILTER (WHERE " + VALID_ORDER + "), 0) AS discounts, " +
                "COUNT(*) AS placed, " +
                "COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled, " +
                "COUNT(DISTINCT shipping_phone) FILTER (WHERE " + VALID_ORDER + ") AS buyers " +
                "FROM orders WHERE created_at >= ? AND created_at < ?",
                r.startTs(), r.endTs());

        // Item margin; older lines without a cost snapshot fall back to the product's current buying price
        BigDecimal itemMargin = jdbc.queryForObject(
                "SELECT COALESCE(SUM(oi.line_total - oi.quantity * COALESCE(oi.unit_cost, p.buying_price, 0)), 0) " +
                "FROM order_items oi JOIN orders o ON o.id = oi.order_id " +
                "LEFT JOIN products p ON p.id = oi.product_id " +
                "WHERE o.created_at >= ? AND o.created_at < ? AND o." + VALID_ORDER,
                BigDecimal.class, r.startTs(), r.endTs());

        Long repeatBuyers = jdbc.queryForObject(
                "SELECT COUNT(DISTINCT o.shipping_phone) FROM orders o " +
                "WHERE o.created_at >= ? AND o.created_at < ? AND o." + VALID_ORDER + " " +
                "AND EXISTS (SELECT 1 FROM orders p WHERE p.shipping_phone = o.shipping_phone " +
                "AND p.created_at < ? AND p." + VALID_ORDER + ")",
                Long.class, r.startTs(), r.endTs(), r.startTs());

        Long newCustomers = jdbc.queryForObject(
                "SELECT COUNT(DISTINCT u.id) FROM users u " +
                "JOIN user_roles ur ON ur.user_id = u.id JOIN roles ro ON ro.id = ur.role_id " +
                "WHERE ro.name = 'CUSTOMER' AND u.created_at >= ? AND u.created_at < ?",
                Long.class, r.startTs(), r.endTs());

        long orders = toLong(totals.get("orders"));
        BigDecimal revenue = toDecimal(totals.get("revenue"));
        BigDecimal discounts = toDecimal(totals.get("discounts"));

        return Metrics.builder()
                .revenue(revenue)
                .orders(orders)
                .averageOrderValue(orders > 0 ? revenue.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                .itemsSold(toLong(totals.get("items")))
                .estimatedProfit(nz(itemMargin).subtract(discounts))
                .ordersPlaced(toLong(totals.get("placed")))
                .cancelledOrders(toLong(totals.get("cancelled")))
                .uniqueBuyers(toLong(totals.get("buyers")))
                .repeatBuyers(nz(repeatBuyers))
                .newCustomers(nz(newCustomers))
                .build();
    }

    /** One point per hour/day/month from the period start to now, with the previous period aligned by position. */
    private List<SeriesPoint> series(DashboardPeriod period, Range current, Range previous) {
        Map<LocalDateTime, long[]> cur = bucketTotals(period, current);
        Map<LocalDateTime, long[]> prev = bucketTotals(period, previous);

        List<SeriesPoint> points = new ArrayList<>();
        LocalDateTime lastBucket = truncate(period, current.end());
        for (int i = 0; ; i++) {
            LocalDateTime bucket = plusBuckets(period, current.start(), i);
            if (bucket.isAfter(lastBucket)) break;
            long[] c = cur.getOrDefault(bucket, new long[2]);
            long[] p = prev.getOrDefault(plusBuckets(period, previous.start(), i), new long[2]);
            points.add(SeriesPoint.builder()
                    .bucketStart(bucket)
                    .revenue(fromPaisa(c[1]))
                    .orders(c[0])
                    .previousRevenue(fromPaisa(p[1]))
                    .previousOrders(p[0])
                    .build());
        }
        return points;
    }

    /** bucket → [orders, revenue in paisa]. The unit comes from the enum, never from user input. */
    private Map<LocalDateTime, long[]> bucketTotals(DashboardPeriod period, Range r) {
        String unit = period.granularity().toLowerCase(Locale.ROOT);
        Map<LocalDateTime, long[]> result = new HashMap<>();
        jdbc.query(
                "SELECT date_trunc('" + unit + "', created_at) AS bucket, COUNT(*) AS orders, " +
                "COALESCE(SUM(total), 0) AS revenue FROM orders " +
                "WHERE created_at >= ? AND created_at < ? AND " + VALID_ORDER + " GROUP BY 1",
                (ResultSet rs) -> {
                    result.put(rs.getTimestamp("bucket").toLocalDateTime(), new long[]{
                            rs.getLong("orders"),
                            rs.getBigDecimal("revenue").movePointRight(2).longValue()
                    });
                },
                r.startTs(), r.endTs());
        return result;
    }

    private List<StatusCount> statusBreakdown(Range r) {
        return jdbc.query(
                "SELECT status, COUNT(*) AS cnt FROM orders WHERE created_at >= ? AND created_at < ? " +
                "GROUP BY status ORDER BY cnt DESC",
                (rs, i) -> new StatusCount(rs.getString("status"), rs.getLong("cnt")),
                r.startTs(), r.endTs());
    }

    private List<PaymentMethodStat> paymentBreakdown(Range r) {
        return jdbc.query(
                "SELECT payment_method, COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS revenue FROM orders " +
                "WHERE created_at >= ? AND created_at < ? AND " + VALID_ORDER + " " +
                "GROUP BY payment_method ORDER BY revenue DESC",
                (rs, i) -> new PaymentMethodStat(rs.getString("payment_method"), rs.getLong("cnt"), rs.getBigDecimal("revenue")),
                r.startTs(), r.endTs());
    }

    private List<TopProduct> topProducts(Range r) {
        return jdbc.query(
                "SELECT oi.product_id, MAX(oi.product_name) AS name, SUM(oi.quantity) AS qty, SUM(oi.line_total) AS revenue " +
                "FROM order_items oi JOIN orders o ON o.id = oi.order_id " +
                "WHERE o.created_at >= ? AND o.created_at < ? AND o." + VALID_ORDER + " " +
                "GROUP BY oi.product_id ORDER BY revenue DESC LIMIT 5",
                (rs, i) -> new TopProduct(rs.getLong("product_id"), rs.getString("name"), rs.getLong("qty"), rs.getBigDecimal("revenue")),
                r.startTs(), r.endTs());
    }

    private Attention attention() {
        Map<String, Object> orders = jdbc.queryForMap(
                "SELECT COUNT(*) FILTER (WHERE status = 'PENDING') AS pending, " +
                "MIN(created_at) FILTER (WHERE status = 'PENDING') AS oldest_pending, " +
                "COUNT(*) FILTER (WHERE payment_status = 'PENDING_VERIFICATION' AND " + VALID_ORDER + ") AS verify, " +
                "COUNT(*) FILTER (WHERE status IN ('CONFIRMED', 'PROCESSING')) AS to_ship " +
                "FROM orders");
        Map<String, Object> products = jdbc.queryForMap(
                "SELECT COUNT(*) FILTER (WHERE is_active) AS active, " +
                "COUNT(*) FILTER (WHERE is_active AND is_trending) AS trending, " +
                "COUNT(*) FILTER (WHERE is_active AND stock_quantity <= 0) AS out_of_stock " +
                "FROM products");
        Long unread = jdbc.queryForObject("SELECT COUNT(*) FROM contact_messages WHERE is_read = false", Long.class);
        Long promos = jdbc.queryForObject(
                "SELECT COUNT(*) FROM promo_codes WHERE is_active = true AND (expires_at IS NULL OR expires_at > ?)",
                Long.class, Timestamp.valueOf(LocalDateTime.now()));
        List<LowStockProduct> lowStock = jdbc.query(
                "SELECT id, CONCAT_WS(' ', name, size_label) AS name, stock_quantity FROM products " +
                "WHERE is_active = true AND stock_quantity <= ? " +
                "ORDER BY stock_quantity ASC, name ASC LIMIT 5",
                (rs, i) -> new LowStockProduct(rs.getLong("id"), rs.getString("name"), rs.getInt("stock_quantity")),
                LOW_STOCK_THRESHOLD);

        Object oldest = orders.get("oldest_pending");
        return Attention.builder()
                .pendingOrders(toLong(orders.get("pending")))
                .oldestPendingAt(oldest instanceof Timestamp ts ? ts.toLocalDateTime() : null)
                .awaitingPaymentVerification(toLong(orders.get("verify")))
                .readyToShip(toLong(orders.get("to_ship")))
                .unreadMessages(nz(unread))
                .outOfStockProducts(toLong(products.get("out_of_stock")))
                .lowStockProducts(lowStock)
                .activeProducts(toLong(products.get("active")))
                .trendingProducts(toLong(products.get("trending")))
                .activePromoCodes(nz(promos))
                .build();
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private static long toLong(Object v) {
        return v == null ? 0 : ((Number) v).longValue();
    }

    private static long nz(Long v) {
        return v == null ? 0 : v;
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static BigDecimal toDecimal(Object v) {
        if (v == null) return BigDecimal.ZERO;
        return v instanceof BigDecimal bd ? bd : new BigDecimal(v.toString());
    }

    private static BigDecimal fromPaisa(long paisa) {
        return BigDecimal.valueOf(paisa, 2);
    }
}
