package com.forsneakypea.fspbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AvatarUpdateRequestDTO {

    @NotBlank(message = "Avatar file id is required")
    private String driveFileId;
}
