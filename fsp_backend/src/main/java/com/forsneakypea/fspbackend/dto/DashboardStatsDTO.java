package com.forsneakypea.fspbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStatsDTO {
    private long totalUsers;
    private long totalMemories;
    private long totalLoveLetters;
    private long totalDatePlans;
    private long pendingNotifications;
    private long unreadNotifications;
    private long archivedContent;
    private String latestLoginUser;
    private OffsetDateTime latestLoginAt;
    // Future-ready: not yet computed from real storage usage.
    private Long storageUsageBytes;
    private List<RecentActivityDTO> recentActivities;
    private List<RecentUploadDTO> recentUploads;
    private List<RecentMemoryDTO> recentMemories;
    private List<RecentNotificationDTO> recentNotifications;
    // status name -> count, e.g. {"DREAMING": 2, "BOOKED": 1, ...}
    private Map<String, Long> datePlanStatusBreakdown;
    private TrendDTO trend;
    private SystemHealthDTO systemHealth;

    @Data
    @Builder
    public static class RecentActivityDTO {
        private String action;
        private String entityType;
        private Long userId;
        private String userName;
        private OffsetDateTime createdAt;
    }

    @Data
    @Builder
    public static class RecentUploadDTO {
        private String photoUrl;
        private String caption;
        private OffsetDateTime createdAt;
    }

    @Data
    @Builder
    public static class RecentMemoryDTO {
        private String name;
        private String coverImageUrl;
        private OffsetDateTime createdAt;
    }

    @Data
    @Builder
    public static class RecentNotificationDTO {
        private String title;
        private String message;
        private String type;
        private Boolean isRead;
        private OffsetDateTime createdAt;
    }

    // Honest deltas only — counts of ActivityLog rows in the last 7 days per
    // module, never a fabricated percentage.
    @Data
    @Builder
    public static class TrendDTO {
        private long lettersThisWeek;
        private long memoriesThisWeek;
        private long datesThisWeek;
    }

    @Data
    @Builder
    public static class SystemHealthDTO {
        private boolean apiReachable;
        private boolean databaseConnected;
        private OffsetDateTime checkedAt;
    }
}
