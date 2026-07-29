package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.request.LoginRequest;
import com.forsneakypea.fspbackend.dto.request.RegisterRequest;
import com.forsneakypea.fspbackend.dto.response.ApiResponse;
import com.forsneakypea.fspbackend.dto.response.AuthResponse;
import com.forsneakypea.fspbackend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"}) // ✅ Supports both /api/auth and /api/v1/auth!
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Account created successfully"));
    }
}