package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.request.LoginRequest;
import com.forsneakypea.fspbackend.dto.request.RegisterRequest;
import com.forsneakypea.fspbackend.dto.response.ApiResponse;
import com.forsneakypea.fspbackend.dto.response.AuthResponse;
import com.forsneakypea.fspbackend.security.AuthRateLimiter;
import com.forsneakypea.fspbackend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth", "/auth"}) // ✅ Supports both /api/auth and /api/v1/auth!
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthRateLimiter rateLimiter;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        rateLimiter.checkAllowed("login:" + clientIp(httpRequest));
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        rateLimiter.checkAllowed("register:" + clientIp(httpRequest));
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Account created successfully"));
    }

    // Behind Render's proxy, server.forward-headers-strategy=native makes Tomcat
    // resolve the real client address from X-Forwarded-For (only when the request
    // comes from a trusted proxy), so getRemoteAddr() is safe to use here. Never
    // read the raw header: clients can put anything in it.
    private String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
