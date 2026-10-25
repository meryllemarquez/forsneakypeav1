package com.forsneakypea.fspbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ThemeUpdateRequestDTO {

    @NotBlank(message = "Theme must be light, dark or system.")
    private String themePref;
}
