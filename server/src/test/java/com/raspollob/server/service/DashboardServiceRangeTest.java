package com.raspollob.server.service;

import com.raspollob.server.dto.dashboard.DashboardPeriod;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class DashboardServiceRangeTest {

    // Wednesday 2026-10-07, 14:30
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 7, 14, 30);

    @Test
    void periodsStartAtTheirCalendarBoundary() {
        assertThat(DashboardService.periodStart(DashboardPeriod.TODAY, NOW)).isEqualTo("2026-10-07T00:00");
        assertThat(DashboardService.periodStart(DashboardPeriod.WEEK, NOW)).isEqualTo("2026-10-05T00:00"); // Monday
        assertThat(DashboardService.periodStart(DashboardPeriod.MONTH, NOW)).isEqualTo("2026-10-01T00:00");
        assertThat(DashboardService.periodStart(DashboardPeriod.YEAR, NOW)).isEqualTo("2026-01-01T00:00");
    }

    @Test
    void previousRangeCoversTheSameElapsedSpan() {
        var current = new DashboardService.Range(LocalDateTime.of(2026, 10, 1, 0, 0), NOW);
        var previous = DashboardService.previousRange(DashboardPeriod.MONTH, current);
        assertThat(previous.start()).isEqualTo("2026-09-01T00:00");
        assertThat(previous.end()).isEqualTo("2026-09-07T14:30");
    }

    @Test
    void previousRangeNeverOverlapsTheCurrentOne() {
        // March 31 vs February: 30 days after Feb 1 would run into March
        var current = new DashboardService.Range(LocalDateTime.of(2026, 3, 1, 0, 0), LocalDateTime.of(2026, 3, 31, 12, 0));
        var previous = DashboardService.previousRange(DashboardPeriod.MONTH, current);
        assertThat(previous.start()).isEqualTo("2026-02-01T00:00");
        assertThat(previous.end()).isEqualTo("2026-03-01T00:00");
    }
}
