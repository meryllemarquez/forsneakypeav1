package com.forsneakypea.fspbackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class LoveStickerRequestDTO {

    @Data
    public static class CreateSticker {
        @NotBlank(message = "Sticker image is required")
        private String image;

        private Double positionX;
        private Double positionY;
        private Double rotation;
        private Double scale;

        @JsonProperty("zIndex")
        private Integer zIndex;
    }

    /** Partial update — every field optional, only non-null ones are applied. */
    @Data
    public static class StickerUpdate {
        private Double positionX;
        private Double positionY;
        private Double rotation;
        private Double scale;

        @JsonProperty("zIndex")
        private Integer zIndex;

        private Boolean isLocked;
    }
}
