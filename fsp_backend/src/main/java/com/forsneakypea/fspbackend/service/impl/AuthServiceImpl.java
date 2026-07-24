package com.forsneakypea.fspbackend.service.impl;

import com.forsneakypea.fspbackend.dto.request.PinVerificationRequest;
import com.forsneakypea.fspbackend.dto.response.PinVerificationResponse;
import com.forsneakypea.fspbackend.service.AuthService;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    @Override
    public PinVerificationResponse verifyPin(PinVerificationRequest request) {
        // Sample PIN check logic (Palitan mo ito ng totoong PIN validation o DB lookup)
        boolean isValidPin = "1234".equals(request.getPin());

        if (isValidPin) {
            return PinVerificationResponse.builder()
                    .authenticated(true)
                    .message("PIN verification successful")
                    .token("dummy-auth-token-12345")
                    .build();
        } else {
            return PinVerificationResponse.builder()
                    .authenticated(false)
                    .message("Invalid PIN provided")
                    .token(null)
                    .build();
        }
    }
}