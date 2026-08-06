package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.FavorableType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class AttachmentDTO {
    private UUID id;
    private FavorableType attachableType;
    private UUID attachableId;
    private String fileUrl;
    private String fileName;
    private String fileType;
    private Long fileSizeBytes;
    private OffsetDateTime createdAt;
}
