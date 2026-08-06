package com.forsneakypea.fspbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "memory_folders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoryFolder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "accent_color", length = 20)
    @Builder.Default
    private String accentColor = "#C73616";

    @Column(name = "icon_style", length = 30)
    @Builder.Default
    private String iconStyle = "camera";

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @Column(name = "is_archived")
    @Builder.Default
    private Boolean isArchived = false;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "is_calendar_highlight")
    @Builder.Default
    private Boolean isCalendarHighlight = false;

    @Column(name = "highlight_photo_id")
    private UUID highlightPhotoId;

    // Where within the calendar cell the highlight photo is focused/cropped —
    // CSS background-position percentages (0-100), not pixels, so they stay
    // valid at any cell/export size.
    @Column(name = "highlight_photo_position_x")
    @Builder.Default
    private Double highlightPhotoPositionX = 50.0;

    @Column(name = "highlight_photo_position_y")
    @Builder.Default
    private Double highlightPhotoPositionY = 50.0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "folder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MemoryPhoto> photos = new ArrayList<>();
}