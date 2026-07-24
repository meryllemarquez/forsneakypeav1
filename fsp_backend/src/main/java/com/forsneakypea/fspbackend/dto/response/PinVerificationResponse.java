package com.forsneakypea.fspbackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PinVerificationResponse {
    private boolean authenticated;
    private String message;
    private String token;
}