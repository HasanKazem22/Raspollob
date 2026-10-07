package com.raspollob.server.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class FailedAttemptLimiterTest {

    /** A clock the test can move forward. */
    private static final class TestClock extends Clock {
        private Instant now = Instant.parse("2026-10-07T10:00:00Z");

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override public Instant instant() { return now; }
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
    }

    private final TestClock clock = new TestClock();
    private final FailedAttemptLimiter limiter = new FailedAttemptLimiter(3, Duration.ofMinutes(15), clock);

    @Test
    void blocksAfterTooManyFailuresAndOnlyThatCaller() {
        limiter.recordFailure("1.1.1.1");
        limiter.recordFailure("1.1.1.1");
        assertThat(limiter.isBlocked("1.1.1.1")).isFalse();

        limiter.recordFailure("1.1.1.1");
        assertThat(limiter.isBlocked("1.1.1.1")).isTrue();
        assertThat(limiter.isBlocked("2.2.2.2")).isFalse();
    }

    @Test
    void unblocksOnceOldFailuresExpire() {
        for (int i = 0; i < 3; i++) limiter.recordFailure("1.1.1.1");
        assertThat(limiter.isBlocked("1.1.1.1")).isTrue();

        clock.advance(Duration.ofMinutes(15));
        assertThat(limiter.isBlocked("1.1.1.1")).isFalse();
    }

    @Test
    void forgetsExpiredCallers() {
        limiter.recordFailure("1.1.1.1");
        clock.advance(Duration.ofMinutes(16));
        limiter.evictExpired();

        // A fresh caller again: three new failures needed to block
        limiter.recordFailure("1.1.1.1");
        limiter.recordFailure("1.1.1.1");
        assertThat(limiter.isBlocked("1.1.1.1")).isFalse();
    }
}
