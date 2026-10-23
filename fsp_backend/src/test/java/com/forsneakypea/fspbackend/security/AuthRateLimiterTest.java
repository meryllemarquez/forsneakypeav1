package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.exception.RateLimitExceededException;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthRateLimiterTest {

    private final AtomicLong nanos = new AtomicLong();
    private final AuthRateLimiter limiter = new AuthRateLimiter(nanos::get);

    @Test
    void blocksAfterMaxAttemptsPerKey() {
        for (int i = 0; i < 10; i++) {
            assertDoesNotThrow(() -> limiter.checkAllowed("login:1.2.3.4"));
        }
        assertThrows(RateLimitExceededException.class, () -> limiter.checkAllowed("login:1.2.3.4"));
    }

    @Test
    void keysAreIndependent() {
        for (int i = 0; i < 10; i++) limiter.checkAllowed("login:1.2.3.4");
        assertDoesNotThrow(() -> limiter.checkAllowed("login:5.6.7.8"));
        assertDoesNotThrow(() -> limiter.checkAllowed("register:1.2.3.4"));
    }

    @Test
    void masksTheLastPartOfTheClientIpInLogs() {
        assertEquals("203.0.113.x", AuthRateLimiter.maskIp("203.0.113.42"));
        assertEquals("2001:db8::x", AuthRateLimiter.maskIp("2001:db8::1a2b"));
        assertEquals("unknown", AuthRateLimiter.maskIp(""));
    }

    @Test
    void entriesExpireAfterTheWindow() {
        for (int i = 0; i < 10; i++) limiter.checkAllowed("login:1.2.3.4");
        assertThrows(RateLimitExceededException.class, () -> limiter.checkAllowed("login:1.2.3.4"));

        nanos.addAndGet(Duration.ofMinutes(16).toNanos());

        assertDoesNotThrow(() -> limiter.checkAllowed("login:1.2.3.4"));
    }
}
