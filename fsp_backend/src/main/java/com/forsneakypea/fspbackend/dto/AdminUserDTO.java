package com.forsneakypea.fspbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Data
@Builder
public class AdminUserDTO {
    private Long id;
    private String name;
    private String username;
    private String role;
    private Boolean active;
    private LocalDateTime lastLoginAt;
    private OffsetDateTime createdAt;
}
