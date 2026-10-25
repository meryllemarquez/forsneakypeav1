package com.forsneakypea.fspbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BouquetDTO {
    private UUID id;
    private String title;
    private Map<String, Object> recipe;
    private Long createdBy;
    private String createdByName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Long version;
}
