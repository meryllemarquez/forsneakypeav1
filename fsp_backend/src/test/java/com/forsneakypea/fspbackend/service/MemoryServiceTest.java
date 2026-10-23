package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.CalendarEntryDTO;
import com.forsneakypea.fspbackend.dto.FolderDTO;
import com.forsneakypea.fspbackend.dto.FolderRequestDTO;
import com.forsneakypea.fspbackend.entity.MemoryFolder;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.repository.MemoryFolderRepository;
import com.forsneakypea.fspbackend.repository.MemoryPhotoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class MemoryServiceTest {

    private MemoryFolderRepository folderRepository;
    private MemoryPhotoRepository photoRepository;
    private NotificationService notificationService;
    private MemoryService service;

    @BeforeEach
    void setUp() {
        folderRepository = mock(MemoryFolderRepository.class);
        photoRepository = mock(MemoryPhotoRepository.class);
        notificationService = mock(NotificationService.class);
        service = new MemoryService(folderRepository, photoRepository, mock(ActivityLogService.class), notificationService);
    }

    @Test
    void createFolderBuildsTheResponseFromMemoryWithoutLoadingPhotos() {
        // Reading folder.getPhotos() would trigger a lazy SELECT in production, so a spy proves
        // the collection is never touched.
        AtomicReference<MemoryFolder> saved = new AtomicReference<>();
        when(folderRepository.save(any(MemoryFolder.class))).thenAnswer(inv -> {
            MemoryFolder folder = spy((MemoryFolder) inv.getArgument(0));
            folder.setId(UUID.randomUUID());
            saved.set(folder);
            return folder;
        });
        FolderRequestDTO.CreateOrUpdateFolder request = new FolderRequestDTO.CreateOrUpdateFolder();
        request.setName("Beach trip");

        FolderDTO dto = service.createFolder(request, 1L);

        assertEquals("Beach trip", dto.getName());
        assertEquals(0, dto.getPhotoCount());
        assertTrue(dto.getPhotos().isEmpty());
        verify(saved.get(), never()).getPhotos();
        verify(notificationService).notifyOthers(1L, NotificationType.MEMORY_CREATED, "Beach trip",
                RelatedEntityType.MEMORY_FOLDER, dto.getId());
        verifyNoInteractions(photoRepository);
    }

    @Test
    void calendarLoadsAllHighlightPhotoUrlsWithOneQueryNotOnePerFolder() {
        UUID photoA = UUID.randomUUID();
        UUID photoB = UUID.randomUUID();
        MemoryFolder a = MemoryFolder.builder().id(UUID.randomUUID()).name("A").eventDate(LocalDate.of(2026, 10, 3))
                .highlightPhotoId(photoA).build();
        MemoryFolder b = MemoryFolder.builder().id(UUID.randomUUID()).name("B").eventDate(LocalDate.of(2026, 10, 9))
                .highlightPhotoId(photoB).build();
        MemoryFolder c = MemoryFolder.builder().id(UUID.randomUUID()).name("C").eventDate(LocalDate.of(2026, 10, 20))
                .highlightPhotoId(UUID.randomUUID()).build(); // its photo row no longer exists
        when(folderRepository.findByEventDateBetweenAndIsCalendarHighlightTrueAndHighlightPhotoIdIsNotNull(any(), any()))
                .thenReturn(List.of(a, b, c));
        when(photoRepository.findPhotoUrlsByIds(anyCollection())).thenReturn(List.of(
                photoUrl(photoA, "https://img/a.jpg"), photoUrl(photoB, "https://img/b.jpg")));

        List<CalendarEntryDTO> entries = service.getCalendarEntries(2026, 10);

        assertEquals(3, entries.size());
        assertEquals("https://img/a.jpg", entries.get(0).getHighlightPhotoUrl());
        assertEquals("https://img/b.jpg", entries.get(1).getHighlightPhotoUrl());
        assertNull(entries.get(2).getHighlightPhotoUrl());
        verify(photoRepository, times(1)).findPhotoUrlsByIds(anyCollection());
        verify(photoRepository, never()).findById(any());
    }

    @Test
    void calendarWithNoHighlightedFoldersRunsNoPhotoQuery() {
        when(folderRepository.findByEventDateBetweenAndIsCalendarHighlightTrueAndHighlightPhotoIdIsNotNull(any(), any()))
                .thenReturn(List.of());

        assertTrue(service.getCalendarEntries(2026, 10).isEmpty());

        verifyNoInteractions(photoRepository);
    }

    private static MemoryPhotoRepository.PhotoUrlRow photoUrl(UUID id, String url) {
        return new MemoryPhotoRepository.PhotoUrlRow() {
            public UUID getId() { return id; }
            public String getPhotoUrl() { return url; }
        };
    }
}
