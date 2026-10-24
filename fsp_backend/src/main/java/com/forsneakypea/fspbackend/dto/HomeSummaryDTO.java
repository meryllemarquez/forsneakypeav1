package com.forsneakypea.fspbackend.dto;

import com.forsneakypea.fspbackend.entity.DateStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Exactly what the Home page renders and nothing else: the 3 newest albums, the next 2 upcoming
 * dates and the latest love note. No photo arrays, checklist items, full note bodies or
 * per-row metadata the page never reads.
 */
@Data
@Builder
public class HomeSummaryDTO {

    private List<FolderCard> folders;
    private List<DateCard> upcomingDates;
    /** Null when there is no visible, unarchived note. */
    private NoteCard latestNote;

    @Data
    @Builder
    public static class FolderCard {
        private UUID id;
        private String name;
        private String description;
        private String coverImageUrl;
        /** Doodle picked for the album ("doodle:<name>"), or the legacy default "camera" for automatic. */
        private String iconStyle;
        private int photoCount;
    }

    @Data
    @Builder
    public static class DateCard {
        private UUID id;
        private String title;
        private LocalDate plannedDate;
        private String location;
        private DateStatus status;
    }

    @Data
    @Builder
    public static class NoteCard {
        /** First 160 characters of the note text (all the card shows). */
        private String content;
        private OffsetDateTime createdAt;
        private String authorName;
    }
}
