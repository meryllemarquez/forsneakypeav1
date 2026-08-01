package com.forsneakypea.fspbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class DateCategoryDTO {
    private UUID id;
    private String name;
    private String colorHex;
    private String icon;
    private String description;
    private OffsetDateTime createdAt;
}
