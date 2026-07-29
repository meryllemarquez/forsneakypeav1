package com.forsneakypea.fspbackend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class FolderDTO {
    private UUID id;
    private String name;
    private String description;
    private String accentColor;
    private String iconStyle;
    private String coverImageUrl;
    private Boolean isArchived;
    private Integer photoCount;
    private OffsetDateTime createdAt;
    private List<PhotoDTO> photos;
}