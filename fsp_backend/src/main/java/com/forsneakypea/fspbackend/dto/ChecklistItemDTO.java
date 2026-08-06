package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.DatePriority;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ChecklistItemDTO {
    private UUID id;
    private UUID dateId;
    private String title;
    private String description;
    private LocalDate dueDate;
    private DatePriority priority;
    private Boolean isCompleted;
    private Integer sortOrder;
    private OffsetDateTime completedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
