package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.entity.User;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Ticker;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.util.function.Function;

/**
 * Short-lived cache of authenticated users, keyed by username, so JwtAuthenticationFilter
 * does not hit the database on every request. Entries live at most {@link #TTL}; they are also
 * evicted as soon as the user row is updated or deleted (see UserCacheEvictionListener), which
 * covers disabling, role changes, password changes and profile edits.
 *
 * Deliberately has no dependencies, so the JPA entity listener can use it without creating a
 * cycle with the EntityManagerFactory.
 */
@Component
public class UserCache {

    static final Duration TTL = Duration.ofSeconds(60);
    private static final long MAX_ENTRIES = 1_000;

    private final Cache<String, User> byUsername;

    public UserCache() {
        this(Ticker.systemTicker());
    }

    // Visible for tests, which drive expiry with a fake ticker.
    UserCache(Ticker ticker) {
        this.byUsername = Caffeine.newBuilder()
                .expireAfterWrite(TTL)
                .maximumSize(MAX_ENTRIES)
                .ticker(ticker)
                .build();
    }

    /** Returns the cached user, or loads and caches it. A null result from the loader is not cached. */
    public User get(String username, Function<String, User> loader) {
        return byUsername.get(username, loader);
    }

    public void evict(User user) {
        if (user == null) return;
        evictById(user.getId());
        if (user.getUsername() != null) byUsername.invalidate(user.getUsername());
    }

    /** Evicts by id as well, so a username change cannot leave the old name cached. */
    public void evictById(Long id) {
        if (id == null) return;
        byUsername.asMap().values().removeIf(u -> id.equals(u.getId()));
    }

    /**
     * Evicts once the surrounding transaction has committed. Evicting earlier would let a
     * concurrent request re-cache the old row (it cannot see uncommitted changes) right after.
     * Outside a transaction it evicts immediately.
     */
    public void evictAfterCommit(User user) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evict(user);
                }
            });
        } else {
            evict(user);
        }
    }

    public long size() {
        return byUsername.estimatedSize();
    }
}
