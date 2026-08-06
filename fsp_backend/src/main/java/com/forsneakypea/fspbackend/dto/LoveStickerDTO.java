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
public class LoveStickerDTO {
    private UUID id;
    private String image;
    private Double positionX;
    private Double positionY;
    private Double rotation;
    private Double scale;

    // See LoveNoteDTO.getZIndex() for why this getter is hand-written instead
    // of annotating the field (avoids a duplicate "zindex"/"zIndex" key pair).
    @Getter(AccessLevel.NONE)
    private Integer zIndex;

    private Boolean isLocked;
    private Long authorId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @JsonProperty("zIndex")
    public Integer getZIndex() {
        return zIndex;
    }
}
