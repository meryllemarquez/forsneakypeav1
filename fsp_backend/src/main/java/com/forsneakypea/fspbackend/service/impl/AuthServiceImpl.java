package com.forsneakypea.fspbackend.service.impl;

import com.forsneakypea.fspbackend.dto.request.LoginRequest;
import com.forsneakypea.fspbackend.dto.request.RegisterRequest;
import com.forsneakypea.fspbackend.dto.response.AuthResponse;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.entity.Role;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.UserRepository;
import com.forsneakypea.fspbackend.service.ActivityLogService;
import com.forsneakypea.fspbackend.service.AuthService;
import com.forsneakypea.fspbackend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID; // Added import for UUID

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final ActivityLogService activityLogService;

    // Added default value :"" to prevent Spring Boot startup crash if property is missing
    @Value("${app.master-password:}")
    private String masterPassword;

    /**
     * Authenticates an existing user and returns a signed JWT token.
     *
     * @param request Contains username and raw password.
     * @return AuthResponse containing JWT token and user profile details.
     */
    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. Fetch user by username or throw a friendly authentication error
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Oops! Incorrect username or password, love. 💕"));

        // 2. Verify raw password against BCrypt password hash stored in database
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Oops! Incorrect username or password, love. 💕");
        }

        // 3. Update last login timestamp safely
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 4. Ensure role is non-null to prevent NullPointerException
        Role userRole = user.getRole() != null ? user.getRole() : Role.ROLE_USER;

        // 5. Generate signed JWT token
        String token = jwtUtil.generateToken(user.getUsername(), userRole.name());
        
        // Log user login activity (Converting Long user.getId() to UUID)
        activityLogService.log(user.getId(), "USER_LOGIN", RelatedEntityType.USER, new UUID(0L, user.getId()));

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .username(user.getUsername())
                .name(user.getName())
                .role(userRole)
                .nickname(user.getNickname())
                .bio(user.getBio())
                .favoriteEmoji(user.getFavoriteEmoji())
                .accentColor(user.getAccentColor())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    /**
     * Registers a new user account protected by the configured master passcode.
     *
     * @param request Contains master passcode, name, username, and password.
     * @return AuthResponse containing JWT token and newly created user profile details.
     */
    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Safe master passcode verification (prevents NullPointerException)
        if (masterPassword == null || masterPassword.isEmpty() || !masterPassword.equals(request.getMasterPassword())) {
            throw new IllegalArgumentException("Invalid master passcode. Cannot create account.");
        }

        // 2. Ensure username is unique
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken.");
        }

        // 3. Encrypt password using BCrypt encoder and persist user entity
        User user = User.builder()
                .name(request.getName())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : Role.ROLE_USER)
                .active(true)
                .build();

        user = userRepository.save(user);

        // 4. Generate signed JWT token for the new user
        Role userRole = user.getRole() != null ? user.getRole() : Role.ROLE_USER;
        String token = jwtUtil.generateToken(user.getUsername(), userRole.name());
        
        // Log user registered activity (Converting Long user.getId() to UUID)
        activityLogService.log(user.getId(), "USER_REGISTERED", RelatedEntityType.USER, new UUID(0L, user.getId()));

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .username(user.getUsername())
                .name(user.getName())
                .role(userRole)
                .nickname(user.getNickname())
                .bio(user.getBio())
                .favoriteEmoji(user.getFavoriteEmoji())
                .accentColor(user.getAccentColor())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}