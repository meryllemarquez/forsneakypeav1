package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.exception.RateLimitExceededException;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Ticker;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
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
            // Keys look like "login:<client ip>". Log the resolved IP (last part masked) so
            // it's possible to verify behind the proxy that different clients get different IPs.
            int sep = key.indexOf(':');
            log.info("Auth attempt rate-limited: action={} clientIp={}",
                    sep < 0 ? key : key.substring(0, sep),
                    sep < 0 ? "unknown" : maskIp(key.substring(sep + 1)));
            throw new RateLimitExceededException("Too many attempts. Please wait a few minutes and try again.");
        }
    }

    // 203.0.113.42 -> 203.0.113.x ; 2001:db8::1a2b -> 2001:db8::x
    static String maskIp(String ip) {
        if (ip == null || ip.isBlank()) return "unknown";
        int cut = Math.max(ip.lastIndexOf('.'), ip.lastIndexOf(':'));
        return cut < 0 ? "x" : ip.substring(0, cut + 1) + "x";
    }
}
