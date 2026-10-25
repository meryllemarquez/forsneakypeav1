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
public class MenuItemDTO {
    private UUID id;
    private String name;
    private String doodle;
    private String lovedBy;
    private String place;
    private Integer pricePhp;
    private String note;
    private Integer sortOrder;
    private Long version;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
