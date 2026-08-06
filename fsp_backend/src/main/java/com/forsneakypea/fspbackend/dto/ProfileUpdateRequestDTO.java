package com.forsneakypea.fspbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequestDTO {

    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 30, message = "Display name must be between 2 and 30 characters")
    private String name;

    @Size(max = 20, message = "Nickname must be under 20 characters")
    private String nickname;

    @Size(max = 100, message = "Bio must be under 100 characters")
    private String bio;

    @Size(max = 8, message = "Favorite emoji is invalid")
    private String favoriteEmoji;

    @Size(max = 20, message = "Accent color is invalid")
    private String accentColor;
}
