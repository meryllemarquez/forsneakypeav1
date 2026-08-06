package com.forsneakypea.fspbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AvatarUpdateRequestDTO {

    @NotBlank(message = "Avatar URL is required")
    private String avatarUrl;

    @NotBlank(message = "Avatar storage path is required")
    private String storagePath;
}
