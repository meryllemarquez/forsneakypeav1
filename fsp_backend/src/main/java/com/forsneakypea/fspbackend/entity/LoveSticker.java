package com.forsneakypea.fspbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "love_stickers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoveSticker {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String image;

    @Column(name = "position_x", nullable = false)
    @Builder.Default
    private Double positionX = 0.0;

    @Column(name = "position_y", nullable = false)
    @Builder.Default
    private Double positionY = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double rotation = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double scale = 1.0;

    @Column(name = "z_index", nullable = false)
    @Builder.Default
    private Integer zIndex = 1;

    @Column(name = "is_locked")
    @Builder.Default
    private Boolean isLocked = false;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
