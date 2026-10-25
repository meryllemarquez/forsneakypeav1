package com.forsneakypea.fspbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WheelSpinDTO {
    private UUID id;
    private UUID wheelId;
    private String choiceId;
    private String label;
    private String doodle;
    private boolean accepted;
    private Long spunBy;
    private OffsetDateTime spunAt;
}
