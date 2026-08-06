package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationDTO {
    private UUID id;
    private NotificationType type;
    private String title;
    private String message;
    private RelatedEntityType relatedEntityType;
    private UUID relatedEntityId;
    private Boolean isRead;
    private OffsetDateTime createdAt;
}
