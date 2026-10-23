package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserCacheTest {

    private final AtomicLong nanos = new AtomicLong();
    private final UserCache cache = new UserCache(nanos::get);

    private static User user(long id, String username) {
        return User.builder().id(id).username(username).name(username).build();
    }

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void loadsOnceThenServesFromCache() {
        AtomicInteger loads = new AtomicInteger();
        User alice = user(1, "alice");

        User first = cache.get("alice", k -> { loads.incrementAndGet(); return alice; });
        User second = cache.get("alice", k -> { loads.incrementAndGet(); return alice; });

        assertSame(first, second);
        assertEquals(1, loads.get());
    }

    @Test
    void entriesExpireAfterSixtySeconds() {
        AtomicInteger loads = new AtomicInteger();
        cache.get("alice", k -> { loads.incrementAndGet(); return user(1, "alice"); });

        nanos.addAndGet(Duration.ofSeconds(59).toNanos());
        cache.get("alice", k -> { loads.incrementAndGet(); return user(1, "alice"); });
        assertEquals(1, loads.get());

        nanos.addAndGet(Duration.ofSeconds(2).toNanos());
        cache.get("alice", k -> { loads.incrementAndGet(); return user(1, "alice"); });
        assertEquals(2, loads.get());
    }

    @Test
    void missingUsersAreNotCached() {
        AtomicInteger loads = new AtomicInteger();
        assertNull(cache.get("ghost", k -> { loads.incrementAndGet(); return null; }));
        assertNull(cache.get("ghost", k -> { loads.incrementAndGet(); return null; }));
        assertEquals(2, loads.get());
    }

    @Test
    void evictRemovesTheUser() {
        AtomicInteger loads = new AtomicInteger();
        User alice = user(1, "alice");
        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });

        cache.evict(alice);
        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });

        assertEquals(2, loads.get());
    }

    @Test
    void evictByIdAlsoCatchesARenamedUser() {
        AtomicInteger loads = new AtomicInteger();
        cache.get("old-name", k -> { loads.incrementAndGet(); return user(1, "old-name"); });

        // The row was renamed, so the entity being evicted no longer carries the cached key.
        cache.evict(user(1, "new-name"));
        cache.get("old-name", k -> { loads.incrementAndGet(); return user(1, "old-name"); });

        assertEquals(2, loads.get());
    }

    @Test
    void evictingOneUserLeavesOthersCached() {
        AtomicInteger loads = new AtomicInteger();
        cache.get("alice", k -> { loads.incrementAndGet(); return user(1, "alice"); });
        cache.get("bob", k -> { loads.incrementAndGet(); return user(2, "bob"); });

        cache.evict(user(1, "alice"));
        cache.get("bob", k -> { loads.incrementAndGet(); return user(2, "bob"); });

        assertEquals(2, loads.get());
    }

    @Test
    void insideATransactionEvictionWaitsForCommit() {
        AtomicInteger loads = new AtomicInteger();
        User alice = user(1, "alice");
        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });

        TransactionSynchronizationManager.initSynchronization();
        cache.evictAfterCommit(alice);

        // Not committed yet: a concurrent request must still not be able to re-cache stale data,
        // and we must not have evicted early either.
        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });
        assertEquals(1, loads.get());

        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });
        assertEquals(2, loads.get());
    }

    @Test
    void rolledBackTransactionNeverEvicts() {
        AtomicInteger loads = new AtomicInteger();
        User alice = user(1, "alice");
        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });

        TransactionSynchronizationManager.initSynchronization();
        cache.evictAfterCommit(alice);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });
        assertEquals(1, loads.get());
    }

    @Test
    void outsideATransactionEvictionIsImmediate() {
        AtomicInteger loads = new AtomicInteger();
        User alice = user(1, "alice");
        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });

        cache.evictAfterCommit(alice);
        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });

        assertEquals(2, loads.get());
    }

    @Test
    void listenerEvictsOnUpdateAndRemove() {
        User alice = user(1, "alice");
        UserCacheEvictionListener listener = new UserCacheEvictionListener(cache);
        AtomicInteger loads = new AtomicInteger();

        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });
        listener.evict(alice);
        cache.get("alice", k -> { loads.incrementAndGet(); return alice; });

        assertEquals(2, loads.get());
    }

    @Test
    void userDetailsServiceHitsTheRepositoryOncePerTtl() {
        UserRepository repo = mock(UserRepository.class);
        when(repo.findByUsername("alice")).thenReturn(Optional.of(user(1, "alice")));
        CachedUserDetailsService service = new CachedUserDetailsService(repo, cache);

        service.loadUserByUsername("alice");
        service.loadUserByUsername("alice");
        service.loadUserByUsername("alice");

        verify(repo, times(1)).findByUsername("alice");
    }

    @Test
    void userDetailsServiceRejectsUnknownUsersAndDoesNotCacheTheMiss() {
        UserRepository repo = mock(UserRepository.class);
        when(repo.findByUsername(anyString())).thenReturn(Optional.empty());
        CachedUserDetailsService service = new CachedUserDetailsService(repo, cache);

        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("ghost"));
        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("ghost"));

        verify(repo, times(2)).findByUsername("ghost");
    }

    @Test
    void anUpdatedUserIsReloadedFromTheRepositoryAfterEviction() {
        UserRepository repo = mock(UserRepository.class);
        User before = user(1, "alice");
        User after = user(1, "alice");
        after.setActive(false);
        when(repo.findByUsername("alice")).thenReturn(Optional.of(before), Optional.of(after));
        CachedUserDetailsService service = new CachedUserDetailsService(repo, cache);

        assertEquals(true, service.loadUserByUsername("alice").isEnabled());
        new UserCacheEvictionListener(cache).evict(after); // what the JPA listener does on UPDATE
        assertEquals(false, service.loadUserByUsername("alice").isEnabled());
    }
}
