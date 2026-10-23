package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.entity.User;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.springframework.stereotype.Component;

/**
 * JPA entity listener (registered on {@link User}) that drops a user from the {@link UserCache}
 * whenever the row is updated or deleted: disabled/enabled, role or password change, rename,
 * profile edit, deletion. Spring instantiates it, so constructor injection works.
 */
@Component
public class UserCacheEvictionListener {

    private final UserCache userCache;

    public UserCacheEvictionListener(UserCache userCache) {
        this.userCache = userCache;
    }

    @PostUpdate
    @PostRemove
    void evict(User user) {
        userCache.evictAfterCommit(user);
    }
}
