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
    // Grid-sized image; photoUrl is the larger lightbox size. Both are signed Drive URLs for Drive photos.
    private String thumbUrl;
    private String driveFileId;
    private String caption;
    private String location;
    private Boolean isFavorite;
    private Integer width;
    private Integer height;
    private OffsetDateTime createdAt;
}