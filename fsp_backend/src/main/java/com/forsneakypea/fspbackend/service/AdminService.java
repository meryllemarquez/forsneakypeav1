package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.AdminUserDTO;
import com.forsneakypea.fspbackend.dto.DashboardStatsDTO;
import com.forsneakypea.fspbackend.entity.ActivityLog;
import com.forsneakypea.fspbackend.entity.MemoryFolder;
import com.forsneakypea.fspbackend.entity.MemoryPhoto;
import com.forsneakypea.fspbackend.entity.Notification;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.exception.ResourceNotFoundException;
import com.forsneakypea.fspbackend.repository.ActivityLogRepository;
import com.forsneakypea.fspbackend.repository.DashboardCountsRepository;
import com.forsneakypea.fspbackend.repository.DateEntryRepository;
import com.forsneakypea.fspbackend.repository.MemoryFolderRepository;
import com.forsneakypea.fspbackend.repository.MemoryPhotoRepository;
import com.forsneakypea.fspbackend.repository.NotificationRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final MemoryFolderRepository memoryFolderRepository;
    private final MemoryPhotoRepository memoryPhotoRepository;
    private final DateEntryRepository dateEntryRepository;
    private final NotificationRepository notificationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final AuditTrailService auditTrailService;
    private final NotificationService notificationService;
    private final DashboardCountsRepository dashboardCountsRepository;
    private final MediaUrlService mediaUrls;

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        OffsetDateTime weekAgo = OffsetDateTime.now().minusDays(7);

        // All headline numbers (totals, archived, unread, this-week trend) in one query.
        DashboardCountsRepository.DashboardCounts counts = dashboardCountsRepository.loadCounts(weekAgo);

        List<ActivityLog> recentLogs = activityLogRepository
                .findAllBy(PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();
        ActivityLog latestLogin = activityLogRepository.findFirstByActionOrderByCreatedAtDesc("USER_LOGIN").orElse(null);

        // Only the users that appear in the activity feed / latest login, not the whole table.
        Set<Long> userIds = recentLogs.stream().map(ActivityLog::getUserId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (latestLogin != null && latestLogin.getUserId() != null) userIds.add(latestLogin.getUserId());
        Map<Long, String> userNames = userIds.isEmpty()
                ? Map.of()
                : userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getName));

        List<MemoryPhoto> recentPhotos = memoryPhotoRepository
                .findAllBy(PageRequest.of(0, 6, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();
        List<MemoryFolder> recentFolders = memoryFolderRepository
                .findAllBy(PageRequest.of(0, 6, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();

        Map<String, Long> statusBreakdown = dateEntryRepository.countByStatus().stream()
                .collect(Collectors.toMap(r -> r.getStatus().name(), DateEntryRepository.StatusCountRow::getTotal));

        List<Notification> recentNotifications = notificationService.listRecentAcrossAllUsers(6);

        long unread = counts.getUnreadNotifications();
        long lettersThisWeek = counts.getLettersThisWeek();
        long memoriesThisWeek = counts.getMemoriesThisWeek();
        long datesThisWeek = counts.getDatesThisWeek();

        return DashboardStatsDTO.builder()
                .totalUsers(counts.getTotalUsers())
                .totalMemories(counts.getTotalFolders())
                .totalLoveLetters(counts.getTotalNotes())
                .totalDatePlans(counts.getTotalDates())
                .pendingNotifications(unread)
                .unreadNotifications(unread)
                .archivedContent(counts.getArchivedFolders() + counts.getArchivedNotes() + counts.getArchivedDates())
                .latestLoginUser(latestLogin != null ? userNames.get(latestLogin.getUserId()) : null)
                .latestLoginAt(latestLogin != null ? latestLogin.getCreatedAt() : null)
                .storageUsageBytes(null)
                .recentActivities(recentLogs.stream().map(l -> DashboardStatsDTO.RecentActivityDTO.builder()
                        .action(l.getAction())
                        .entityType(l.getEntityType() != null ? l.getEntityType().name() : null)
                        .userId(l.getUserId())
                        .userName(userNames.get(l.getUserId()))
                        .createdAt(l.getCreatedAt())
                        .build()).collect(Collectors.toList()))
                .recentUploads(recentPhotos.stream().map(p -> DashboardStatsDTO.RecentUploadDTO.builder()
                        .photoUrl(mediaUrls.resolve(p.getPhotoUrl(), p.getDriveFileId(), MediaUrlService.Size.THUMB))
                        .caption(p.getCaption())
                        .createdAt(p.getCreatedAt())
                        .build()).collect(Collectors.toList()))
                .recentMemories(recentFolders.stream().map(f -> DashboardStatsDTO.RecentMemoryDTO.builder()
                        .name(f.getName())
                        .coverImageUrl(mediaUrls.resolve(f.getCoverImageUrl(), f.getCoverDriveFileId(), MediaUrlService.Size.THUMB))
                        .createdAt(f.getCreatedAt())
                        .build()).collect(Collectors.toList()))
                .recentNotifications(recentNotifications.stream().map(n -> DashboardStatsDTO.RecentNotificationDTO.builder()
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .type(n.getType() != null ? n.getType().name() : null)
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build()).collect(Collectors.toList()))
                .datePlanStatusBreakdown(statusBreakdown)
                .trend(DashboardStatsDTO.TrendDTO.builder()
                        .lettersThisWeek(lettersThisWeek)
                        .memoriesThisWeek(memoriesThisWeek)
                        .datesThisWeek(datesThisWeek)
                        .build())
                .systemHealth(DashboardStatsDTO.SystemHealthDTO.builder()
                        .apiReachable(true)
                        .databaseConnected(true)
                        .checkedAt(OffsetDateTime.now())
                        .build())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminUserDTO> getUsers() {
        return userRepository.findAll().stream().map(this::mapUser).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminUserDTO getUser(Long id) {
        return mapUser(findUserOrThrow(id));
    }

    @Transactional
    public AdminUserDTO setUserActive(Long id, boolean active, Long actorId, String reason) {
        User user = findUserOrThrow(id);
        boolean before = Boolean.TRUE.equals(user.getActive());
        user.setActive(active);
        user = userRepository.save(user);

        auditTrailService.record(actorId, "USER", null, active ? "USER_ENABLED" : "USER_DISABLED",
                Map.of("active", before), Map.of("active", active), Map.of("active", active), reason);

        return mapUser(user);
    }

    @Transactional
    public void deleteUser(Long id, Long actorId, String reason) {
        User user = findUserOrThrow(id);
        auditTrailService.record(actorId, "USER", null, "USER_DELETED",
                Map.of("username", user.getUsername(), "role", user.getRole().name()), null, null, reason);
        userRepository.deleteById(id);
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private AdminUserDTO mapUser(User user) {
        return AdminUserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .active(user.getActive())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
