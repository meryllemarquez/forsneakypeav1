package com.forsneakypea.fspbackend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.forsneakypea.fspbackend.dto.request.RegisterRequest;
import com.forsneakypea.fspbackend.dto.response.AuthResponse;
import com.forsneakypea.fspbackend.entity.Role;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.UserRepository;
import com.forsneakypea.fspbackend.service.ActivityLogService;
import com.forsneakypea.fspbackend.service.MediaUrlService;
import com.forsneakypea.fspbackend.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceImplTest {

    private UserRepository userRepository;
    private JwtUtil jwtUtil;
    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        jwtUtil = mock(JwtUtil.class);
        ActivityLogService activityLog = mock(ActivityLogService.class);
        service = new AuthServiceImpl(userRepository, encoder, jwtUtil, activityLog, new MediaUrlService());
        ReflectionTestUtils.setField(service, "masterPassword", "master-secret");

        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(encoder.encode(anyString())).thenReturn("hashed");
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("jwt");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(7L);
            return u;
        });
    }

    @Test
    void registerAlwaysCreatesAUserEvenIfRequestBodyAsksForAdmin() throws Exception {
        // Body as an attacker would send it, including a role field.
        String body = """
                {"masterPassword":"master-secret","name":"Eve","username":"eve",
                 "password":"password123","role":"ROLE_ADMIN"}""";
        // Same unknown-property handling as Spring MVC's default mapper.
        ObjectMapper mapper = Jackson2ObjectMapperBuilder.json().build();
        RegisterRequest request = mapper.readValue(body, RegisterRequest.class);

        AuthResponse response = service.register(request);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals(Role.ROLE_USER, saved.getValue().getRole());
        assertEquals(Role.ROLE_USER, response.getRole());
        verify(jwtUtil).generateToken(eq("eve"), eq("ROLE_USER"));
    }
}
