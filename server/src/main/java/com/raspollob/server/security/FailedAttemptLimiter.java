package com.raspollob.server.security;

import org.springframework.scheduling.annotation.Scheduled;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Counts failed attempts per caller (e.g. IP address) in a sliding time window and blocks callers who
 * fail too often, which makes guessing (order numbers, phone numbers…) impractical. Successful attempts
 * are never counted, so real customers aren't affected. In memory: per server instance.
 */
public class FailedAttemptLimiter {

    private final int maxFailures;
    private final Duration window;
    private final Clock clock;
    private final Map<String, Deque<Long>> failures = new ConcurrentHashMap<>();

    public FailedAttemptLimiter(int maxFailures, Duration window, Clock clock) {
        this.maxFailures = maxFailures;
        this.window = window;
        this.clock = clock;
    }

    /** True when this caller has used up their failed attempts for now. */
    public boolean isBlocked(String caller) {
        Deque<Long> times = failures.get(caller);
        if (times == null) {
            return false;
        }
        synchronized (times) {
            prune(times);
            return times.size() >= maxFailures;
        }
    }

    public void recordFailure(String caller) {
        Deque<Long> times = failures.computeIfAbsent(caller, k -> new ArrayDeque<>());
        synchronized (times) {
            prune(times);
            times.addLast(clock.millis());
        }
    }

    /** Forget callers whose failures have all expired, so memory doesn't grow over time. */
    @Scheduled(fixedDelay = 10 * 60 * 1000)
    public void evictExpired() {
        failures.entrySet().removeIf(entry -> {
            Deque<Long> times = entry.getValue();
            synchronized (times) {
                prune(times);
                return times.isEmpty();
            }
        });
    }

    private void prune(Deque<Long> times) {
        long cutoff = clock.millis() - window.toMillis();
        while (!times.isEmpty() && times.peekFirst() <= cutoff) {
            times.pollFirst();
        }
    }
}
