package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.DashboardStatsDTO;
import com.forsneakypea.fspbackend.entity.ActivityLog;
import com.forsneakypea.fspbackend.entity.DateStatus;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.ActivityLogRepository;
import com.forsneakypea.fspbackend.repository.DashboardCountsRepository;
import com.forsneakypea.fspbackend.repository.DateEntryRepository;
import com.forsneakypea.fspbackend.repository.MemoryFolderRepository;
import com.forsneakypea.fspbackend.repository.MemoryPhotoRepository;
import com.forsneakypea.fspbackend.repository.NotificationRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.SliceImpl;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminServiceTest {

    private UserRepository userRepository;
    private MemoryFolderRepository folderRepository;
    private MemoryPhotoRepository photoRepository;
    private DateEntryRepository dateEntryRepository;
    private ActivityLogRepository activityLogRepository;
    private DashboardCountsRepository countsRepository;
    private NotificationService notificationService;
    private AdminService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        folderRepository = mock(MemoryFolderRepository.class);
        photoRepository = mock(MemoryPhotoRepository.class);
        dateEntryRepository = mock(DateEntryRepository.class);
        activityLogRepository = mock(ActivityLogRepository.class);
        countsRepository = mock(DashboardCountsRepository.class);
        notificationService = mock(NotificationService.class);
        service = new AdminService(userRepository, folderRepository, photoRepository, dateEntryRepository,
                mock(NotificationRepository.class), activityLogRepository, mock(AuditTrailService.class),
                notificationService, countsRepository);

        when(countsRepository.loadCounts(any(OffsetDateTime.class))).thenReturn(counts());
        when(folderRepository.findAllBy(any(Pageable.class))).thenReturn(new SliceImpl<>(List.of()));
        when(photoRepository.findAllBy(any(Pageable.class))).thenReturn(new SliceImpl<>(List.of()));
        when(dateEntryRepository.countByStatus()).thenReturn(List.of(
                statusRow(DateStatus.DREAMING, 3), statusRow(DateStatus.COMPLETED, 2)));
    }

    private static DashboardCountsRepository.DashboardCounts counts() {
        return new DashboardCountsRepository.DashboardCounts() {
            public long getTotalUsers() { return 3; }
            public long getTotalFolders() { return 10; }
            public long getArchivedFolders() { return 1; }
            public long getTotalNotes() { return 20; }
            public long getArchivedNotes() { return 2; }
            public long getTotalDates() { return 5; }
            public long getArchivedDates() { return 4; }
            public long getUnreadNotifications() { return 7; }
            public long getLettersThisWeek() { return 6; }
            public long getMemoriesThisWeek() { return 8; }
            public long getDatesThisWeek() { return 9; }
        };
    }

    private static DateEntryRepository.StatusCountRow statusRow(DateStatus status, long total) {
        return new DateEntryRepository.StatusCountRow() {
            public DateStatus getStatus() { return status; }
            public long getTotal() { return total; }
        };
    }

    @Test
    void headlineNumbersComeFromTheSingleCountsQuery() {
        when(activityLogRepository.findAllBy(any(Pageable.class))).thenReturn(new SliceImpl<>(List.of()));
        when(activityLogRepository.findFirstByActionOrderByCreatedAtDesc("USER_LOGIN")).thenReturn(java.util.Optional.empty());

        DashboardStatsDTO dto = service.getDashboardStats();

        assertEquals(3, dto.getTotalUsers());
        assertEquals(10, dto.getTotalMemories());
        assertEquals(20, dto.getTotalLoveLetters());
        assertEquals(5, dto.getTotalDatePlans());
        assertEquals(7, dto.getUnreadNotifications());
        assertEquals(7, dto.getPendingNotifications());
        assertEquals(1 + 2 + 4, dto.getArchivedContent());
        assertEquals(6, dto.getTrend().getLettersThisWeek());
        assertEquals(8, dto.getTrend().getMemoriesThisWeek());
        assertEquals(9, dto.getTrend().getDatesThisWeek());
        assertEquals(java.util.Map.of("DREAMING", 3L, "COMPLETED", 2L), dto.getDatePlanStatusBreakdown());
        assertNull(dto.getLatestLoginUser());
        verify(countsRepository, times(1)).loadCounts(any(OffsetDateTime.class));
    }

    @Test
    void neverLoadsWholeTablesOrScansHundredsOfActivityLogs() {
        when(activityLogRepository.findAllBy(any(Pageable.class))).thenReturn(new SliceImpl<>(List.of()));
        when(activityLogRepository.findFirstByActionOrderByCreatedAtDesc("USER_LOGIN")).thenReturn(java.util.Optional.empty());

        service.getDashboardStats();

        verify(folderRepository, never()).findAllByOrderByCreatedAtDesc();
        verify(folderRepository, never()).findAll();
        verify(dateEntryRepository, never()).findAllByDeletedAtIsNullOrderByCreatedAtDesc();
        verify(userRepository, never()).findAll();
        verify(userRepository, never()).count();
        verify(activityLogRepository, never()).findAll(any(Pageable.class));
    }

    @Test
    void onlyUsersShownOnTheDashboardAreLoadedAndNamed() {
        ActivityLog log = ActivityLog.builder().id(UUID.randomUUID()).userId(2L).action("DATE_CREATED")
                .entityType(RelatedEntityType.DATE).build();
        ActivityLog login = ActivityLog.builder().id(UUID.randomUUID()).userId(3L).action("USER_LOGIN")
                .createdAt(OffsetDateTime.parse("2026-10-23T10:00:00Z")).build();
        when(activityLogRepository.findAllBy(any(Pageable.class))).thenReturn(new SliceImpl<>(List.of(log)));
        when(activityLogRepository.findFirstByActionOrderByCreatedAtDesc("USER_LOGIN")).thenReturn(java.util.Optional.of(login));
        when(userRepository.findAllById(anyCollection())).thenReturn(List.of(
                User.builder().id(2L).name("CJ").build(), User.builder().id(3L).name("Merylle").build()));

        DashboardStatsDTO dto = service.getDashboardStats();

        assertEquals("Merylle", dto.getLatestLoginUser());
        assertEquals("CJ", dto.getRecentActivities().get(0).getUserName());
        verify(userRepository, times(1)).findAllById(anyCollection());
    }
}
