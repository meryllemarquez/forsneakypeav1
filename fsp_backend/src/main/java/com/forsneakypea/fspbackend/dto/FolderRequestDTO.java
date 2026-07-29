package com.forsneakypea.fspbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

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
    }

    @Data
    public static class PhotoUpdate {
        private String caption;
        private String location;
        private Boolean isFavorite;
    }
}
