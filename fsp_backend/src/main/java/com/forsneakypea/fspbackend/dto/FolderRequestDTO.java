package com.forsneakypea.fspbackend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

public class FolderRequestDTO {

    @Data
    public static class CreateOrUpdateFolder {
        @NotBlank(message = "Folder name is required")
        @Size(max = 100, message = "Folder name must be under 100 characters")
        private String name;

        private String description;
        private String accentColor = "#C73616";
        private String iconStyle = "camera";
        private String coverImageUrl;
        private Boolean isArchived = false;
        private LocalDate eventDate;
        private Boolean isCalendarHighlight = false;
    }

    @Data
    public static class PhotoUpdate {
        private String caption;
        private String location;
        private Boolean isFavorite;
    }

    @Data
    public static class PositionUpdate {
        @NotNull(message = "positionX is required")
        @DecimalMin(value = "0", message = "positionX must be between 0 and 100")
        @DecimalMax(value = "100", message = "positionX must be between 0 and 100")
        private Double positionX;

        @NotNull(message = "positionY is required")
        @DecimalMin(value = "0", message = "positionY must be between 0 and 100")
        @DecimalMax(value = "100", message = "positionY must be between 0 and 100")
        private Double positionY;
    }
}
