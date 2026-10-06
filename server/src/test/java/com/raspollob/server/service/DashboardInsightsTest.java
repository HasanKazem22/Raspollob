package com.raspollob.server.service;

import com.raspollob.server.dto.dashboard.DashboardPeriod;
import com.raspollob.server.dto.dashboard.DashboardResponse.Attention;
import com.raspollob.server.dto.dashboard.DashboardResponse.Insight;
import com.raspollob.server.dto.dashboard.DashboardResponse.InsightLevel;
import com.raspollob.server.dto.dashboard.DashboardResponse.LowStockProduct;
import com.raspollob.server.dto.dashboard.DashboardResponse.Metrics;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DashboardInsightsTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 7, 12, 0);

    private static Metrics metrics(String revenue, long orders) {
        return Metrics.builder()
                .revenue(new BigDecimal(revenue))
                .orders(orders)
                .averageOrderValue(orders > 0 ? new BigDecimal(revenue).divide(BigDecimal.valueOf(orders)) : BigDecimal.ZERO)
                .estimatedProfit(new BigDecimal(revenue).multiply(new BigDecimal("0.3")))
                .ordersPlaced(orders)
                .build();
    }

    /** A healthy store: nothing pending, stocked, promos and trending set up. */
    private static Attention.AttentionBuilder healthy() {
        return Attention.builder()
                .lowStockProducts(List.of())
                .activeProducts(10)
                .trendingProducts(3)
                .activePromoCodes(1);
    }

    private static List<String> titles(List<Insight> insights) {
        return insights.stream().map(Insight::getTitle).toList();
    }

    @Test
    void healthyStoreWithSteadySalesHasNoWarnings() {
        List<Insight> insights = DashboardInsights.build(DashboardPeriod.WEEK,
                metrics("10000", 10), metrics("10000", 10), healthy().build(), new BigDecimal("1200"), NOW);
        assertThat(insights).noneMatch(i -> i.getLevel() == InsightLevel.CRITICAL || i.getLevel() == InsightLevel.WARNING);
    }

    @Test
    void salesDropIsFlaggedWithThePercentage() {
        List<Insight> insights = DashboardInsights.build(DashboardPeriod.WEEK,
                metrics("6000", 6), metrics("10000", 10), healthy().build(), new BigDecimal("1200"), NOW);
        assertThat(titles(insights)).contains("Sales are down 40%");
    }

    @Test
    void urgentProblemsComeFirstAndListIsCapped() {
        Attention busy = healthy()
                .pendingOrders(3)
                .oldestPendingAt(NOW.minusDays(2))
                .outOfStockProducts(2)
                .awaitingPaymentVerification(4)
                .unreadMessages(5)
                .lowStockProducts(List.of(new LowStockProduct(1L, "Honey", 2)))
                .activePromoCodes(0)
                .trendingProducts(0)
                .build();
        List<Insight> insights = DashboardInsights.build(DashboardPeriod.MONTH,
                metrics("6000", 6), metrics("10000", 10), busy, null, NOW);

        assertThat(insights).hasSize(DashboardInsights.MAX_INSIGHTS);
        assertThat(insights.get(0).getLevel()).isEqualTo(InsightLevel.CRITICAL);
        assertThat(titles(insights)).contains("Orders waiting over a day", "Products out of stock");
    }

    @Test
    void percentChangeIsNullWithoutABaseline() {
        assertThat(DashboardInsights.percentChange(new BigDecimal("500"), BigDecimal.ZERO)).isNull();
        assertThat(DashboardInsights.percentChange(new BigDecimal("150"), new BigDecimal("100"))).isEqualByComparingTo("50");
    }
}
