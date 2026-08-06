package com.forsneakypea.fspbackend.dto;

import lombok.Data;

@Data
public class AdminUserRequestDTO {
    private Boolean active;
    private String reason;
}
