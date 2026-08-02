package com.forsneakypea.fspbackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class LoveNoteDTO {
    private UUID id;
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
    private Double rotation;
    private Double positionX;
    private Double positionY;

    // Lombok's default getter for this field is getZIndex(), but Jackson's
    // bean-name mangling turns that into JSON key "zindex" (consecutive
    // capitals confuse its decapitalize heuristic). @JsonProperty directly on
    // the field would just create a SECOND, duplicate "zIndex" key alongside
    // the unfixed "zindex" one from the auto-generated getter — so the getter
    // itself is hand-written here and pinned instead.
    @Getter(AccessLevel.NONE)
    private Integer zIndex;

    private Boolean isFavorite;
    private Boolean isArchived;
    private Boolean isPrivate;
    private String mood;
    private Long authorId;
    private String authorName;
    private Boolean isMine;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @JsonProperty("zIndex")
    public Integer getZIndex() {
        return zIndex;
    }
}
