package com.forsneakypea.fspbackend.service.impl;

import com.forsneakypea.fspbackend.dto.request.LoginRequest;
import com.forsneakypea.fspbackend.dto.response.AuthResponse;
import com.forsneakypea.fspbackend.entity.Role;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.UserRepository;
import com.forsneakypea.fspbackend.service.ActivityLogService;
import com.forsneakypea.fspbackend.service.MediaUrlService;
import com.forsneakypea.fspbackend.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceLoginTest {

    private UserRepository userRepository;
    private PasswordEncoder encoder;
    private JwtUtil jwtUtil;
    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        encoder = mock(PasswordEncoder.class);
        jwtUtil = mock(JwtUtil.class);
        service = new AuthServiceImpl(userRepository, encoder, jwtUtil, mock(ActivityLogService.class), new MediaUrlService());
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("jwt");
    }

    private static LoginRequest request(String username, String password) {
        LoginRequest request = new LoginRequest();
        request.setUsername(username);
        request.setPassword(password);
        return request;
    }

    private User user(boolean active) {
        User user = User.builder().id(1L).username("cj").name("CJ").passwordHash("hash")
                .role(Role.ROLE_USER).active(active).build();
        when(userRepository.findByUsername("cj")).thenReturn(Optional.of(user));
        return user;
    }

    @Test
    void anActiveUserWithTheRightPasswordLogsIn() {
        user(true);
        when(encoder.matches("secret", "hash")).thenReturn(true);

        AuthResponse response = service.login(request("cj", "secret"));

        assertEquals("jwt", response.getToken());
    }

    @Test
    void aDisabledUserCannotLogInEvenWithTheRightPassword() {
        user(false);
        when(encoder.matches("secret", "hash")).thenReturn(true);

        assertThrows(BadCredentialsException.class, () -> service.login(request("cj", "secret")));

        verify(jwtUtil, never()).generateToken(anyString(), anyString());
        verify(userRepository, never()).save(any(User.class)); // no last-login update either
    }

    @Test
    void aDisabledUsersErrorIsIdenticalToAWrongPasswordAndToAnUnknownUser() {
        // wrong password for an active account
        user(true);
        when(encoder.matches("wrong", "hash")).thenReturn(false);
        String wrongPassword = assertThrows(BadCredentialsException.class,
                () -> service.login(request("cj", "wrong"))).getMessage();

        // unknown account
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());
        String unknownUser = assertThrows(BadCredentialsException.class,
                () -> service.login(request("ghost", "whatever"))).getMessage();

        // disabled account (right password)
        User disabled = User.builder().id(2L).username("old").name("Old").passwordHash("hash2")
                .role(Role.ROLE_USER).active(false).build();
        when(userRepository.findByUsername("old")).thenReturn(Optional.of(disabled));
        when(encoder.matches("secret", "hash2")).thenReturn(true);
        String disabledAccount = assertThrows(BadCredentialsException.class,
                () -> service.login(request("old", "secret"))).getMessage();

        assertEquals(wrongPassword, unknownUser);
        assertEquals(wrongPassword, disabledAccount);
    }
}
