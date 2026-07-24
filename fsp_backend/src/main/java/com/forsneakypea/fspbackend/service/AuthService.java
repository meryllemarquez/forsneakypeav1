package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.request.PinVerificationRequest;
import com.forsneakypea.fspbackend.dto.response.PinVerificationResponse;

public interface AuthService {
    PinVerificationResponse verifyPin(PinVerificationRequest request);
}