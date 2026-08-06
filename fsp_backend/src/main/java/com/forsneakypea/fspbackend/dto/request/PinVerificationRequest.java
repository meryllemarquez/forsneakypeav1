package com.forsneakypea.fspbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PinVerificationRequest {

    @NotBlank(message = "PIN cannot be empty")
    private String pin;
}