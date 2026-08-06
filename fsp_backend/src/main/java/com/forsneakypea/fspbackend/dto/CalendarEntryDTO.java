package com.forsneakypea.fspbackend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class CalendarEntryDTO {
    private UUID folderId;
    private String folderName;
    private String description;
    private LocalDate eventDate;
    private String highlightPhotoUrl;
    private Double highlightPhotoPositionX;
    private Double highlightPhotoPositionY;
}
