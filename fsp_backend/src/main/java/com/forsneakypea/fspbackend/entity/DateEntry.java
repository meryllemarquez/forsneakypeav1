package com.forsneakypea.fspbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A single bucket-list entry. Mapped to the "dates" table; named DateEntry
 * (not "Date") to avoid clashing with java.time/java.util.Date.
 */
@Entity
@Table(name = "dates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DateEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private DateCategory category;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String location;

    @Column(name = "planned_date")
    private LocalDate plannedDate;

    @Column(name = "planned_time")
    private LocalTime plannedTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "activity_type", length = 50)
    private String activityType;

    @Column(name = "travel_method", length = 50)
    private String travelMethod;

    @Column(name = "special_occasion", length = 150)
    private String specialOccasion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DateStatus status = DateStatus.DREAMING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private DatePriority priority = DatePriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "reservation_status", nullable = false, length = 20)
    @Builder.Default
    private ReservationStatus reservationStatus = ReservationStatus.NOT_NEEDED;

    @Column(name = "estimated_cost", precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @Column(name = "cover_drive_file_id", columnDefinition = "TEXT")
    private String coverDriveFileId;

    @Column(name = "is_archived")
    @Builder.Default
    private Boolean isArchived = false;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @OneToMany(mappedBy = "date", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ChecklistItem> checklistItems = new ArrayList<>();
}
