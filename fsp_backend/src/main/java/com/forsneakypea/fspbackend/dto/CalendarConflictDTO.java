package com.forsneakypea.fspbackend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class CalendarConflictDTO {
    private UUID conflictingFolderId;
    private String conflictingFolderName;
    private String conflictingHighlightPhotoUrl;
    private LocalDate eventDate;
}
