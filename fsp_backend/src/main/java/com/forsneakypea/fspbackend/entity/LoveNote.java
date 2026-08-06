package com.forsneakypea.fspbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "love_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoveNote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    // Opaque JSON (array of positioned/styled text box objects), same
    // free-form-text convention as `content` — the backend never parses
    // this, it's the frontend's canvas editor's source of truth. Null/blank
    // means the note predates the multi-text-box editor and should fall
    // back to rendering `title`/`content` as a single block.
    @Column(name = "content_blocks", columnDefinition = "TEXT")
    private String contentBlocks;

    // Opaque JSON (array of freely positioned pin/tape objects). Null/blank
    // means the note predates this and should fall back to the single
    // attachment_type/pin_image/tape_image trio below.
    @Column(columnDefinition = "TEXT")
    private String attachments;

    @Column(name = "paper_image", nullable = false, length = 120)
    private String paperImage;

    @Enumerated(EnumType.STRING)
    @Column(name = "attachment_type", nullable = false, length = 10)
    @Builder.Default
    private AttachmentType attachmentType = AttachmentType.NONE;

    @Column(name = "pin_image", length = 120)
    private String pinImage;

    @Column(name = "tape_image", length = 120)
    private String tapeImage;

    @Column(length = 20)
    private String color;

    @Column(name = "font_family", length = 60)
    @Builder.Default
    private String fontFamily = "Patrick Hand";

    @Column(name = "font_size")
    @Builder.Default
    private Integer fontSize = 18;

    @Column(name = "font_color", length = 20)
    @Builder.Default
    private String fontColor = "#2b2b2b";

    @Column(nullable = false)
    @Builder.Default
    private Double rotation = 0.0;

    @Column(name = "position_x", nullable = false)
    @Builder.Default
    private Double positionX = 0.0;

    @Column(name = "position_y", nullable = false)
    @Builder.Default
    private Double positionY = 0.0;

    @Column(name = "z_index", nullable = false)
    @Builder.Default
    private Integer zIndex = 1;

    @Column(name = "is_favorite")
    @Builder.Default
    private Boolean isFavorite = false;

    @Column(name = "is_archived")
    @Builder.Default
    private Boolean isArchived = false;

    @Column(name = "is_private")
    @Builder.Default
    private Boolean isPrivate = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private NoteMood mood;

    @Column(name = "created_by")
    private Long createdBy;

    // Hibernate-managed (not DB-trigger-managed like MemoryFolder/DateEntry)
    // since love_board_schema.sql's trigger is optional to run, not required.
    @CreationTimestamp
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
