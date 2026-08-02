package com.forsneakypea.fspbackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class LoveNoteRequestDTO {

    /**
     * Used for both create and full edit. On create, paperImage is required;
     * every other field is optional and falls back to entity defaults. On
     * update, only non-null fields are applied (partial update), matching
     * FolderRequestDTO.PhotoUpdate.
     */
    @Data
    public static class CreateOrUpdateNote {
        private String title;
        private String content;
        private String contentBlocks;
        private String attachments;

        @NotBlank(message = "Paper is required")
        private String paperImage;

        private String attachmentType;
        private String pinImage;
        private String tapeImage;
        private String color;
        private String fontFamily;
        private Integer fontSize;
        private String fontColor;
        private Double rotation;
        private Double positionX;
        private Double positionY;

        @JsonProperty("zIndex")
        private Integer zIndex;

        private Boolean isFavorite;
        private Boolean isArchived;
        private Boolean isPrivate;
        private String mood;
    }

    /** Partial update — every field optional, only non-null ones are applied. */
    @Data
    public static class NoteUpdate {
        private String title;
        private String content;
        private String contentBlocks;
        private String attachments;
        private String paperImage;
        private String attachmentType;
        private String pinImage;
        private String tapeImage;
        private String color;
        private String fontFamily;
        private Integer fontSize;
        private String fontColor;
        private Boolean isFavorite;
        private Boolean isArchived;
        private Boolean isPrivate;
        private String mood;
    }

    /** High-frequency drag/rotate/reorder persistence, kept separate from NoteUpdate. */
    @Data
    public static class PositionUpdate {
        private Double positionX;
        private Double positionY;
        private Double rotation;

        @JsonProperty("zIndex")
        private Integer zIndex;
    }
}
