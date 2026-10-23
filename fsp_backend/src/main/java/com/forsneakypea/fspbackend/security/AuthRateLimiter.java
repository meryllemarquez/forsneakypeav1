package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.exception.RateLimitExceededException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Ticker;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

// Fixed-window limiter for /api/auth/login and /api/auth/register.
// This app has exactly two legitimate user accounts and runs as a single instance,
// so an in-memory counter (rather than Redis/Bucket4j) is enough to blunt brute-force
// attempts against the login form and the static master-password registration gate.
// Entries expire WINDOW after the first attempt (and the cache is size-bounded), so
// keys from one-off clients don't accumulate forever.
@Component
public class AuthRateLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final long MAX_TRACKED_KEYS = 10_000;

    private final Cache<String, AtomicInteger> attemptsByKey;

    public AuthRateLimiter() {
        this(Ticker.systemTicker());
    }

    // Visible for tests, which drive expiry with a fake ticker.
    AuthRateLimiter(Ticker ticker) {
        this.attemptsByKey = Caffeine.newBuilder()
                .expireAfterWrite(WINDOW)
                .maximumSize(MAX_TRACKED_KEYS)
                .ticker(ticker)
                .build();
    }

    public void checkAllowed(String key) {
        AtomicInteger attempts = attemptsByKey.get(key, k -> new AtomicInteger());
        if (attempts.incrementAndGet() > MAX_ATTEMPTS) {
            throw new RateLimitExceededException("Too many attempts. Please wait a few minutes and try again.");
        }
    }
}
