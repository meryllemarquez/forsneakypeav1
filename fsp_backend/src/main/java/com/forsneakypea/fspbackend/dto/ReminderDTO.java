package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.ReminderChannel;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ReminderDTO {
    private UUID id;
    private UUID dateId;
    private OffsetDateTime remindAt;
    private ReminderChannel channel;
    private String message;
    private Boolean isSent;
    private OffsetDateTime createdAt;
}
