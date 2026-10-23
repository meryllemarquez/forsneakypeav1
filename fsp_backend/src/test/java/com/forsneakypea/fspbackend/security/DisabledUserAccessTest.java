package com.forsneakypea.fspbackend.security;

import com.forsneakypea.fspbackend.config.SecurityConfig;
import com.forsneakypea.fspbackend.controller.AuthController;
import com.forsneakypea.fspbackend.entity.Role;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.UserRepository;
import com.forsneakypea.fspbackend.service.AuthService;
import com.forsneakypea.fspbackend.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Real SecurityConfig + real JwtAuthenticationFilter + the real user cache. Proves that a
 * disabled user's (still validly signed) token is rejected, and that disabling takes effect
 * immediately even though the user was already cached.
 */
@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, DisabledUserAccessTest.RealCacheConfig.class})
class DisabledUserAccessTest {

    @TestConfiguration
    static class RealCacheConfig {
        static final UserRepository REPOSITORY = mock(UserRepository.class);
        static final UserCache CACHE = new UserCache(); // real 60s TTL; the test never waits it out

        @Bean
        UserDetailsService userDetailsService() {
            return new CachedUserDetailsService(REPOSITORY, CACHE);
        }
    }

    @Autowired MockMvc mvc;

    @MockBean AuthService authService;
    @MockBean AuthRateLimiter rateLimiter;
    @MockBean JwtUtil jwtUtil;
    @MockBean AuthenticationProvider authenticationProvider;

    private static final String PROTECTED = "/api/v1/memories/folders"; // no controller in this slice: 404 once authenticated
    private static final String BEARER = "Bearer a-validly-signed-token";

    private User alice;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(1L).username("alice").name("Alice").role(Role.ROLE_USER).active(true).build();
        RealCacheConfig.CACHE.evict(alice);
        org.mockito.Mockito.reset(RealCacheConfig.REPOSITORY);
        when(RealCacheConfig.REPOSITORY.findByUsername("alice")).thenAnswer(inv -> Optional.of(alice));
        when(jwtUtil.extractUsername(anyString())).thenReturn("alice");
        when(jwtUtil.validateToken(anyString(), anyString())).thenReturn(true);
    }

    @Test
    void anEnabledUsersTokenIsAccepted() throws Exception {
        mvc.perform(get(PROTECTED).header("Authorization", BEARER)).andExpect(status().isNotFound());
    }

    @Test
    void aDisabledUsersTokenIsRejectedWith401() throws Exception {
        alice.setActive(false);

        mvc.perform(get(PROTECTED).header("Authorization", BEARER)).andExpect(status().isUnauthorized());
    }

    @Test
    void disablingAnAlreadyCachedUserTakesEffectImmediately() throws Exception {
        // 1. Alice is active and her user is now in the cache.
        mvc.perform(get(PROTECTED).header("Authorization", BEARER)).andExpect(status().isNotFound());

        // 2. An admin disables her. The database row changes and Hibernate fires the user
        //    entity listener, which evicts her from the cache (what happens on UPDATE).
        User disabledRow = User.builder().id(1L).username("alice").name("Alice").role(Role.ROLE_USER).active(false).build();
        alice = disabledRow;
        new UserCacheEvictionListener(RealCacheConfig.CACHE).evict(disabledRow);

        // 3. Her very next request - well inside the 60s TTL - is rejected.
        mvc.perform(get(PROTECTED).header("Authorization", BEARER)).andExpect(status().isUnauthorized());
    }

    @Test
    void withoutEvictionTheCacheWouldHaveLetHerThrough() throws Exception {
        // Documents why the eviction above matters: the cache alone serves the stale, enabled user.
        mvc.perform(get(PROTECTED).header("Authorization", BEARER)).andExpect(status().isNotFound());

        alice = User.builder().id(1L).username("alice").name("Alice").role(Role.ROLE_USER).active(false).build();

        mvc.perform(get(PROTECTED).header("Authorization", BEARER)).andExpect(status().isNotFound());
    }
}
