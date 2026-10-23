package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * The authenticated user already loaded by the JWT filter. Services use it to avoid re-querying
 * the actor (name, id) that the request already carries.
 */
public final class CurrentUser {

    private CurrentUser() {}

    public static Optional<User> get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    /** The current user's display name, but only if they are the user with this id. */
    public static Optional<String> nameIfId(Long userId) {
        return get().filter(u -> u.getId() != null && u.getId().equals(userId)).map(User::getName);
    }
}
