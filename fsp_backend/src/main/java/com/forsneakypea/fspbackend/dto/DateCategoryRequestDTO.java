package com.forsneakypea.fspbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class DateCategoryRequestDTO {

    @Data
    public static class Create {
        @NotBlank(message = "Category name is required")
        @Size(max = 60, message = "Category name must be under 60 characters")
        private String name;

        private String colorHex;
        private String icon;
        private String description;
    }
}
