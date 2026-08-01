package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ActivityLogDTO {
    private UUID id;
    private Long userId;
    private String action;
    private RelatedEntityType entityType;
    private UUID entityId;
    private String metadata;
    private OffsetDateTime createdAt;
}
