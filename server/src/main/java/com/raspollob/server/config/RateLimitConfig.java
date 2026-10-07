package com.raspollob.server.config;

import com.raspollob.server.security.FailedAttemptLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.Duration;

@Configuration
public class RateLimitConfig {

    /** Track Order: 10 wrong order-number/phone combinations per 15 minutes per IP address. */
    @Bean
    public FailedAttemptLimiter orderTrackingLimiter() {
        return new FailedAttemptLimiter(10, Duration.ofMinutes(15), Clock.systemUTC());
    }
}
