package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.AdminUserDTO;
import com.forsneakypea.fspbackend.dto.DashboardStatsDTO;
import com.forsneakypea.fspbackend.entity.ActivityLog;
import com.forsneakypea.fspbackend.entity.DateEntry;
import com.forsneakypea.fspbackend.entity.LoveNote;
import com.forsneakypea.fspbackend.entity.MemoryFolder;
import com.forsneakypea.fspbackend.entity.MemoryPhoto;
import com.forsneakypea.fspbackend.entity.Notification;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.exception.ResourceNotFoundException;
import com.forsneakypea.fspbackend.repository.ActivityLogRepository;
import com.forsneakypea.fspbackend.repository.DateEntryRepository;
import com.forsneakypea.fspbackend.repository.LoveNoteRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final MemoryFolderRepository memoryFolderRepository;
    private final MemoryPhotoRepository memoryPhotoRepository;
    private final LoveNoteRepository loveNoteRepository;
    private final DateEntryRepository dateEntryRepository;
    private final NotificationRepository notificationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final AuditTrailService auditTrailService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        List<MemoryFolder> folders = memoryFolderRepository.findAllByOrderByCreatedAtDesc();
        List<LoveNote> notes = loveNoteRepository.findAllByOrderByUpdatedAtDesc();
        long archivedFolders = folders.stream().filter(f -> Boolean.TRUE.equals(f.getIsArchived())).count();
        long archivedNotes = notes.stream().filter(n -> Boolean.TRUE.equals(n.getIsArchived())).count();
        long archivedDates = dateEntryRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsArchived())).count();

        long unread = notificationRepository.countByIsReadAndDeletedAtIsNull(false);

        List<ActivityLog> recentLogs = activityLogRepository
                .findAll(PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();
        Map<Long, String> userNames = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        ActivityLog latestLogin = activityLogRepository
                .findAll(PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent().stream()
                .filter(l -> "USER_LOGIN".equals(l.getAction()))
                .findFirst()
                .orElse(null);
        // The single most-recent page might not contain a login row; fall back
        // to a small scan if needed (dataset is tiny for this app).
        if (latestLogin == null) {
            latestLogin = activityLogRepository
                    .findAll(PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt")))
                    .getContent().stream()
                    .filter(l -> "USER_LOGIN".equals(l.getAction()))
                    .findFirst()
                    .orElse(null);
        }

        List<MemoryPhoto> recentPhotos = memoryPhotoRepository
                .findAll(PageRequest.of(0, 6, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();

        List<DateEntry> allDates = dateEntryRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();
        Map<String, Long> statusBreakdown = allDates.stream()
                .collect(Collectors.groupingBy(d -> d.getStatus().name(), Collectors.counting()));

        List<Notification> recentNotifications = notificationService.listRecentAcrossAllUsers(6);

        OffsetDateTime weekAgo = OffsetDateTime.now().minusDays(7);
        List<ActivityLog> recentWeekLogs = activityLogRepository
                .findAll(PageRequest.of(0, 500, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent().stream()
                .filter(l -> l.getCreatedAt() != null && l.getCreatedAt().isAfter(weekAgo))
                .collect(Collectors.toList());
        long lettersThisWeek = recentWeekLogs.stream().filter(l -> "LOVE_NOTE_CREATED".equals(l.getAction())).count();
        long memoriesThisWeek = recentWeekLogs.stream().filter(l -> "MEMORY_FOLDER_CREATED".equals(l.getAction())).count();
        long datesThisWeek = recentWeekLogs.stream().filter(l -> "DATE_CREATED".equals(l.getAction())).count();

        return DashboardStatsDTO.builder()
                .totalUsers(userRepository.count())
                .totalMemories(folders.size())
                .totalLoveLetters(notes.size())
                .totalDatePlans(dateEntryRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc().size())
                .pendingNotifications(unread)
                .unreadNotifications(unread)
                .archivedContent(archivedFolders + archivedNotes + archivedDates)
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
                        .photoUrl(p.getPhotoUrl())
                        .caption(p.getCaption())
                        .createdAt(p.getCreatedAt())
                        .build()).collect(Collectors.toList()))
                .recentMemories(folders.stream().limit(6).map(f -> DashboardStatsDTO.RecentMemoryDTO.builder()
                        .name(f.getName())
                        .coverImageUrl(f.getCoverImageUrl())
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
