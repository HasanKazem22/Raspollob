package com.raspollob.server.dto.dashboard;

/**
 * Reporting window. Each covers the current period up to now ("period to date") and is
 * compared with the same elapsed span of the previous period, so partial periods compare fairly.
 */
public enum DashboardPeriod {
    /** Today, hourly buckets, vs yesterday */
    TODAY("HOUR", "yesterday"),
    /** This week (Mon–Sun), daily buckets, vs last week */
    WEEK("DAY", "last week"),
    /** This month, daily buckets, vs last month */
    MONTH("DAY", "last month"),
    /** This year, monthly buckets, vs last year */
    YEAR("MONTH", "last year");

    private final String granularity;
    private final String previousLabel;

    DashboardPeriod(String granularity, String previousLabel) {
        this.granularity = granularity;
        this.previousLabel = previousLabel;
    }

    /** HOUR, DAY or MONTH — also a valid PostgreSQL date_trunc unit */
    public String granularity() {
        return granularity;
    }

    /** e.g. "last week", used in comparisons and tips */
    public String previousLabel() {
        return previousLabel;
    }
}
