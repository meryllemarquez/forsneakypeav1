package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.FavorableType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class FavoriteDTO {
    private UUID id;
    private FavorableType favorableType;
    private UUID favorableId;
    private OffsetDateTime createdAt;
}
