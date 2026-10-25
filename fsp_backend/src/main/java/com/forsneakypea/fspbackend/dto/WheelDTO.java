package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.WheelChoice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WheelDTO {
    private UUID id;
    private String name;
    private List<WheelChoice> choices;
    private Long version;
    private OffsetDateTime updatedAt;
}
