package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.HomeSummaryDTO;
import com.forsneakypea.fspbackend.entity.MemoryFolder;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.DateEntryRepository;
import com.forsneakypea.fspbackend.repository.LoveNoteRepository;
import com.forsneakypea.fspbackend.repository.MemoryFolderRepository;
import com.forsneakypea.fspbackend.repository.MemoryPhotoRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import com.forsneakypea.fspbackend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HomeService {

    static final int FOLDER_LIMIT = 3;
    static final int DATE_LIMIT = 2;

    private final MemoryFolderRepository folderRepository;
    private final MemoryPhotoRepository photoRepository;
    private final DateEntryRepository dateEntryRepository;
    private final LoveNoteRepository noteRepository;
    private final UserRepository userRepository;

    /**
     * @param today the viewer's local date (the client sends it so "upcoming" matches their
     *              calendar, not the server's time zone); defaults to the server date.
     */
    @Transactional(readOnly = true)
    public HomeSummaryDTO getSummary(Long currentUserId, LocalDate today) {
        LocalDate day = today != null ? today : LocalDate.now();

        // Newest unarchived albums, with photo counts for just those albums in one query.
        List<MemoryFolder> folders = folderRepository
                .findByIsArchivedOrderByCreatedAtDesc(false, PageRequest.of(0, FOLDER_LIMIT)).getContent();
        List<UUID> folderIds = folders.stream().map(MemoryFolder::getId).collect(Collectors.toList());
        Map<UUID, Long> photoCounts = folderIds.isEmpty()
                ? Map.of()
                : photoRepository.countByFolderIds(folderIds).stream()
                        .collect(Collectors.toMap(MemoryPhotoRepository.FolderPhotoCountRow::getFolderId,
                                MemoryPhotoRepository.FolderPhotoCountRow::getTotal));

        List<HomeSummaryDTO.FolderCard> folderCards = folders.stream()
                .map(f -> HomeSummaryDTO.FolderCard.builder()
                        .id(f.getId())
                        .name(f.getName())
                        .description(f.getDescription())
                        .coverImageUrl(f.getCoverImageUrl())
                        .iconStyle(f.getIconStyle())
                        .photoCount(photoCounts.getOrDefault(f.getId(), 0L).intValue())
                        .build())
                .collect(Collectors.toList());

        List<HomeSummaryDTO.DateCard> dateCards = dateEntryRepository
                .findUpcoming(day, PageRequest.of(0, DATE_LIMIT)).getContent().stream()
                .map(d -> HomeSummaryDTO.DateCard.builder()
                        .id(d.getId())
                        .title(d.getTitle())
                        .plannedDate(d.getPlannedDate())
                        .location(d.getLocation())
                        .status(d.getStatus())
                        .build())
                .collect(Collectors.toList());

        HomeSummaryDTO.NoteCard noteCard = noteRepository
                .findLatestVisible(currentUserId, PageRequest.of(0, 1)).getContent().stream()
                .findFirst()
                .map(n -> HomeSummaryDTO.NoteCard.builder()
                        .content(n.getContent())
                        .createdAt(n.getCreatedAt())
                        .authorName(authorName(n.getCreatedBy()))
                        .build())
                .orElse(null);

        return HomeSummaryDTO.builder()
                .folders(folderCards)
                .upcomingDates(dateCards)
                .latestNote(noteCard)
                .build();
    }

    private String authorName(Long createdBy) {
        if (createdBy == null) return null;
        return CurrentUser.nameIfId(createdBy)
                .orElseGet(() -> userRepository.findById(createdBy).map(User::getName).orElse("Unknown"));
    }
}
