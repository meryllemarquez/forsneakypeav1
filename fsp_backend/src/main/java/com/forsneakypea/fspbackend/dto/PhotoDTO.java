package com.forsneakypea.fspbackend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class PhotoDTO {
    private UUID id;
    private UUID folderId;
    private String photoUrl;
    private String storagePath;
    private String caption;
    private String location;
    private Boolean isFavorite;
    private Integer width;
    private Integer height;
    private OffsetDateTime createdAt;
}