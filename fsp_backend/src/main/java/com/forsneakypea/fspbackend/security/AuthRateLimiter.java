package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.exception.RateLimitExceededException;
import org.springframework.stereotype.Component;

import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

// Simple in-memory fixed-window limiter for /api/auth/login and /api/auth/register.
// This app has exactly two legitimate user accounts and runs as a single instance,
// so an in-memory counter (rather than Redis/Bucket4j) is enough to blunt brute-force
// attempts against the login form and the static master-password registration gate.
@Component
public class AuthRateLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 15 * 60 * 1000L; // 15 minutes

    private final Map<String, Deque<Long>> attemptsByKey = new ConcurrentHashMap<>();

    public void checkAllowed(String key) {
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = attemptsByKey.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= MAX_ATTEMPTS) {
                throw new RateLimitExceededException("Too many attempts. Please wait a few minutes and try again.");
            }
            timestamps.addLast(now);
        }
    }
}
