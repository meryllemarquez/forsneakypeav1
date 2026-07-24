package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.request.PinVerificationRequest;
import com.forsneakypea.fspbackend.dto.response.ApiResponse;
import com.forsneakypea.fspbackend.dto.response.PinVerificationResponse;
import com.forsneakypea.fspbackend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/verify-pin")
    public ResponseEntity<ApiResponse<PinVerificationResponse>> verifyPin(
            @Valid @RequestBody PinVerificationRequest request) {
            
        PinVerificationResponse response = authService.verifyPin(request);

        if (response.isAuthenticated()) {
            return ResponseEntity.ok(ApiResponse.success(response, "PIN verified successfully"));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error(response.getMessage()));
        }
    }
}