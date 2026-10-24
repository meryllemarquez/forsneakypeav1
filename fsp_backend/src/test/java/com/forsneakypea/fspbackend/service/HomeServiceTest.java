package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.HomeSummaryDTO;
import com.forsneakypea.fspbackend.entity.DateStatus;
import com.forsneakypea.fspbackend.entity.MemoryFolder;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.DateEntryRepository;
import com.forsneakypea.fspbackend.repository.LoveNoteRepository;
import com.forsneakypea.fspbackend.repository.MemoryFolderRepository;
import com.forsneakypea.fspbackend.repository.MemoryPhotoRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.SliceImpl;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class HomeServiceTest {

    private MemoryFolderRepository folderRepository;
    private MemoryPhotoRepository photoRepository;
    private DateEntryRepository dateRepository;
    private LoveNoteRepository noteRepository;
    private UserRepository userRepository;
    private HomeService service;

    private final User me = User.builder().id(1L).username("merylle").name("Merylle").build();

    @BeforeEach
    void setUp() {
        folderRepository = mock(MemoryFolderRepository.class);
        photoRepository = mock(MemoryPhotoRepository.class);
        dateRepository = mock(DateEntryRepository.class);
        noteRepository = mock(LoveNoteRepository.class);
        userRepository = mock(UserRepository.class);
        service = new HomeService(folderRepository, photoRepository, dateRepository, noteRepository, userRepository);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(me, null, me.getAuthorities()));

        when(folderRepository.findByIsArchivedOrderByCreatedAtDesc(anyBoolean(), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of()));
        when(dateRepository.findUpcoming(any(LocalDate.class), any(Pageable.class))).thenReturn(new SliceImpl<>(List.of()));
        when(noteRepository.findLatestVisible(anyLong(), any(Pageable.class))).thenReturn(new SliceImpl<>(List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void emptyAccountGetsEmptyListsAndNoNoteWithoutExtraQueries() {
        HomeSummaryDTO summary = service.getSummary(1L, LocalDate.of(2026, 10, 23));

        assertTrue(summary.getFolders().isEmpty());
        assertTrue(summary.getUpcomingDates().isEmpty());
        assertNull(summary.getLatestNote());
        verifyNoInteractions(photoRepository); // no folders -> no photo-count query
        verifyNoInteractions(userRepository);
    }

    @Test
    void foldersAreLimitedToThreeAndCountedWithOneQuery() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        when(folderRepository.findByIsArchivedOrderByCreatedAtDesc(anyBoolean(), any(Pageable.class))).thenReturn(new SliceImpl<>(List.of(
                MemoryFolder.builder().id(a).name("Beach").description("Sun").coverImageUrl("https://img/a.jpg").iconStyle("doodle:plane").build(),
                MemoryFolder.builder().id(b).name("Hike").build())));
        when(photoRepository.countByFolderIds(anyCollection())).thenReturn(List.of(count(a, 7)));

        HomeSummaryDTO summary = service.getSummary(1L, LocalDate.of(2026, 10, 23));

        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(folderRepository).findByIsArchivedOrderByCreatedAtDesc(org.mockito.ArgumentMatchers.eq(false), page.capture());
        assertEquals(3, page.getValue().getPageSize());
        assertEquals(2, summary.getFolders().size());
        assertEquals("Beach", summary.getFolders().get(0).getName());
        assertEquals(7, summary.getFolders().get(0).getPhotoCount());
        assertEquals("doodle:plane", summary.getFolders().get(0).getIconStyle()); // the picked doodle reaches Home
        assertEquals("camera", summary.getFolders().get(1).getIconStyle());      // entity default (automatic)
        assertEquals(0, summary.getFolders().get(1).getPhotoCount()); // no photos row -> 0
        verify(photoRepository).countByFolderIds(anyCollection());
    }

    @Test
    void upcomingDatesUseTheViewersDateAndAreLimitedToTwo() {
        LocalDate today = LocalDate.of(2026, 12, 31); // client's local date, not the server's
        UUID id = UUID.randomUUID();
        when(dateRepository.findUpcoming(any(LocalDate.class), any(Pageable.class))).thenReturn(new SliceImpl<>(List.of(
                upcoming(id, "Sunset walk", LocalDate.of(2027, 1, 2), "Pier", DateStatus.PLANNING))));

        HomeSummaryDTO summary = service.getSummary(1L, today);

        ArgumentCaptor<LocalDate> day = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(dateRepository).findUpcoming(day.capture(), page.capture());
        assertEquals(today, day.getValue());
        assertEquals(2, page.getValue().getPageSize());
        HomeSummaryDTO.DateCard card = summary.getUpcomingDates().get(0);
        assertEquals("Sunset walk", card.getTitle());
        assertEquals(LocalDate.of(2027, 1, 2), card.getPlannedDate());
        assertEquals("Pier", card.getLocation());
        assertEquals(DateStatus.PLANNING, card.getStatus());
    }

    @Test
    void missingTodayFallsBackToTheServerDate() {
        service.getSummary(1L, null);

        ArgumentCaptor<LocalDate> day = ArgumentCaptor.forClass(LocalDate.class);
        verify(dateRepository).findUpcoming(day.capture(), any(Pageable.class));
        assertEquals(LocalDate.now(), day.getValue());
    }

    @Test
    void latestNoteIsAskedForOnlyAsTheViewerAndNamedFromTheLoggedInUser() {
        OffsetDateTime created = OffsetDateTime.parse("2026-10-20T08:00:00Z");
        when(noteRepository.findLatestVisible(anyLong(), any(Pageable.class))).thenReturn(new SliceImpl<>(List.of(
                note("I love you to the moon", created, 1L))));

        HomeSummaryDTO summary = service.getSummary(1L, LocalDate.of(2026, 10, 23));

        verify(noteRepository).findLatestVisible(org.mockito.ArgumentMatchers.eq(1L), any(Pageable.class));
        assertEquals("I love you to the moon", summary.getLatestNote().getContent());
        assertEquals(created, summary.getLatestNote().getCreatedAt());
        assertEquals("Merylle", summary.getLatestNote().getAuthorName());
        verify(userRepository, never()).findById(any()); // author is the authenticated user: no lookup
    }

    @Test
    void partnersNoteLooksUpTheAuthorOnce() {
        when(noteRepository.findLatestVisible(anyLong(), any(Pageable.class))).thenReturn(new SliceImpl<>(List.of(
                note("hi", OffsetDateTime.now(), 2L))));
        when(userRepository.findById(2L)).thenReturn(Optional.of(User.builder().id(2L).name("CJ").build()));

        HomeSummaryDTO summary = service.getSummary(1L, LocalDate.of(2026, 10, 23));

        assertEquals("CJ", summary.getLatestNote().getAuthorName());
        verify(userRepository).findById(2L);
    }

    private static MemoryPhotoRepository.FolderPhotoCountRow count(UUID folderId, long total) {
        return new MemoryPhotoRepository.FolderPhotoCountRow() {
            public UUID getFolderId() { return folderId; }
            public long getTotal() { return total; }
        };
    }

    private static DateEntryRepository.UpcomingDateRow upcoming(UUID id, String title, LocalDate date, String location, DateStatus status) {
        return new DateEntryRepository.UpcomingDateRow() {
            public UUID getId() { return id; }
            public String getTitle() { return title; }
            public LocalDate getPlannedDate() { return date; }
            public String getLocation() { return location; }
            public DateStatus getStatus() { return status; }
        };
    }

    private static LoveNoteRepository.LatestNoteRow note(String content, OffsetDateTime createdAt, Long createdBy) {
        return new LoveNoteRepository.LatestNoteRow() {
            public String getContent() { return content; }
            public OffsetDateTime getCreatedAt() { return createdAt; }
            public Long getCreatedBy() { return createdBy; }
        };
    }
}
