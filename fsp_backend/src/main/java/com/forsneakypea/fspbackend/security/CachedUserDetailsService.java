package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/** Loads users through {@link UserCache}; unknown usernames are never cached. */
public class CachedUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserCache userCache;

    public CachedUserDetailsService(UserRepository userRepository, UserCache userCache) {
        this.userRepository = userRepository;
        this.userCache = userCache;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userCache.get(username, name -> userRepository.findByUsername(name).orElse(null));
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        return user;
    }
}
