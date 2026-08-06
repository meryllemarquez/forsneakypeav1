package com.forsneakypea.fspbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class ProfileDTO {
    private Long id;
    private String username;
    private String name;
    private String nickname;
    private String bio;
    private String favoriteEmoji;
    private String accentColor;
    private String avatarUrl;
    private String role;
    private OffsetDateTime updatedAt;
}
