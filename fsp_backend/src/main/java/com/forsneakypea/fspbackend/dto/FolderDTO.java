package com.forsneakypea.fspbackend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
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
    private String coverDriveFileId;
    private Boolean isArchived;
    private Integer photoCount;
    private OffsetDateTime createdAt;
    private LocalDate eventDate;
    private Boolean isCalendarHighlight;
    private UUID highlightPhotoId;
    private Double highlightPhotoPositionX;
    private Double highlightPhotoPositionY;
    private List<PhotoDTO> photos;
}