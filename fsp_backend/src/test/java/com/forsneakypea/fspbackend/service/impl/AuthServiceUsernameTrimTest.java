package com.forsneakypea.fspbackend.service.impl;

import com.forsneakypea.fspbackend.dto.request.LoginRequest;
import com.forsneakypea.fspbackend.dto.request.RegisterRequest;
import com.forsneakypea.fspbackend.dto.response.AuthResponse;
import com.forsneakypea.fspbackend.entity.Role;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.UserRepository;
import com.forsneakypea.fspbackend.service.ActivityLogService;
import com.forsneakypea.fspbackend.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Usernames are trimmed on register and login, and a blank one is rejected. */
class AuthServiceUsernameTrimTest {

    private UserRepository userRepository;
    private PasswordEncoder encoder;
    private JwtUtil jwtUtil;
    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        encoder = mock(PasswordEncoder.class);
        jwtUtil = mock(JwtUtil.class);
        service = new AuthServiceImpl(userRepository, encoder, jwtUtil, mock(ActivityLogService.class));
        ReflectionTestUtils.setField(service, "masterPassword", "master-secret");
        when(encoder.encode(anyString())).thenReturn("hashed");
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("jwt");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(9L);
            return u;
        });
    }

    private static RegisterRequest register(String username) {
        return new RegisterRequest("master-secret", "Junie", username, "password123");
    }

    private static LoginRequest login(String username) {
        LoginRequest request = new LoginRequest();
        request.setUsername(username);
        request.setPassword("secret");
        return request;
    }

    // ---- register ----

    @Test
    void registerStoresTheUsernameTrimmed() {
        AuthResponse response = service.register(register("  junebug "));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals("junebug", saved.getValue().getUsername());
        assertEquals("junebug", response.getUsername());
        verify(jwtUtil).generateToken("junebug", "ROLE_USER");
    }

    @Test
    void registerChecksUniquenessAgainstTheTrimmedName() {
        when(userRepository.existsByUsername("junebug")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.register(register("junebug ")));

        verify(userRepository).existsByUsername("junebug");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerRejectsAUsernameThatIsBlankAfterTrimming() {
        for (String blank : new String[]{"", "   ", "\t\n", null}) {
            IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () -> service.register(register(blank)));
            assertEquals("Username is required.", error.getMessage());
        }
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerKeepsInnerSpaces() {
        service.register(register(" Master Admin "));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals("Master Admin", saved.getValue().getUsername());
    }

    // ---- login ----

    @Test
    void loginFindsTheUserEvenWhenTheTypedUsernameHasSpaces() {
        User cj = User.builder().id(4L).username("cj").name("CJ").passwordHash("hash").role(Role.ROLE_USER).active(true).build();
        when(userRepository.findByUsername("cj")).thenReturn(Optional.of(cj));
        when(encoder.matches("secret", "hash")).thenReturn(true);

        AuthResponse response = service.login(login("  cj\t"));

        assertEquals("cj", response.getUsername());
        verify(userRepository).findByUsername("cj");
    }

    @Test
    void loginWithABlankUsernameFailsLikeAnyWrongCredentialWithoutTouchingTheDatabase() {
        for (String blank : new String[]{"", "   ", null}) {
            BadCredentialsException error = assertThrows(BadCredentialsException.class, () -> service.login(login(blank)));
            assertEquals("Oops! Incorrect username or password, love. 💕", error.getMessage());
        }
        verify(userRepository, never()).findByUsername(anyString());
    }
}
