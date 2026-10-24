package com.forsneakypea.fspbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "memory_photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoryPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id", nullable = false)
    private MemoryFolder folder;

    // Legacy Supabase photos only; Drive-backed photos use driveFileId instead.
    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "storage_path", columnDefinition = "TEXT")
    private String storagePath;

    @Column(name = "drive_file_id", columnDefinition = "TEXT")
    private String driveFileId;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(length = 100)
    private String location;

    @Column(name = "is_favorite")
    @Builder.Default
    private Boolean isFavorite = false;

    private Integer width;
    private Integer height;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}