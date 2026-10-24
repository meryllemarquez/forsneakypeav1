package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.DatePriority;
import com.forsneakypea.fspbackend.entity.DateStatus;
import com.forsneakypea.fspbackend.entity.ReservationStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DateEntryDTO {
    private UUID id;
    private UUID categoryId;
    private String categoryName;
    private String categoryColorHex;
    private String title;
    private String description;
    private String location;
    private LocalDate plannedDate;
    private LocalTime plannedTime;
    private Integer durationMinutes;
    private String activityType;
    private String travelMethod;
    private String specialOccasion;
    private DateStatus status;
    private DatePriority priority;
    private ReservationStatus reservationStatus;
    private BigDecimal estimatedCost;
    private String coverImageUrl;
    private String coverThumbUrl;
    private String coverDriveFileId;
    private Boolean isArchived;
    private Boolean isFavorite;
    private Long createdBy;
    private String createdByName;
    private Integer checklistCompletedCount;
    private Integer checklistTotalCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<ChecklistItemDTO> checklistItems;
}
