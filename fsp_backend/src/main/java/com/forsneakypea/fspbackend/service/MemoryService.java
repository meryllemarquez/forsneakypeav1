package com.forsneakypea.fspbackend.service;


import com.forsneakypea.fspbackend.exception.NotFoundException;
import com.forsneakypea.fspbackend.dto.CalendarConflictDTO;
import com.forsneakypea.fspbackend.dto.CalendarEntryDTO;
import com.forsneakypea.fspbackend.dto.FolderDTO;
import com.forsneakypea.fspbackend.dto.FolderRequestDTO;
import com.forsneakypea.fspbackend.dto.PhotoDTO;
import com.forsneakypea.fspbackend.entity.MemoryFolder;
import com.forsneakypea.fspbackend.entity.MemoryPhoto;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.exception.CalendarConflictException;
import com.forsneakypea.fspbackend.repository.MemoryFolderRepository;
import com.forsneakypea.fspbackend.repository.MemoryPhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemoryService {

    private final MemoryFolderRepository folderRepository;
    private final MemoryPhotoRepository photoRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<FolderDTO> getAllFolders(boolean includeArchived) {
        List<MemoryFolder> folders = includeArchived ?
                folderRepository.findAllByOrderByCreatedAtDesc() :
                folderRepository.findAllByIsArchivedOrderByCreatedAtDesc(false);

        // List view only ever needs each folder's photo COUNT (the grid shows
        // "N Photos" badges, never the photo array itself — see FolderDTO usage
        // in MemoriesPage.jsx). Batch-count instead of lazy-initializing every
        // folder's full photos collection (which was both an N+1 and a payload-
        // bloat problem: every photo's full row was being serialized into every
        // folder in the list).
        List<UUID> folderIds = folders.stream().map(MemoryFolder::getId).collect(Collectors.toList());
        Map<UUID, Long> photoCounts = folderIds.isEmpty()
                ? Map.of()
                : photoRepository.countByFolderIds(folderIds).stream()
                        .collect(Collectors.toMap(MemoryPhotoRepository.FolderPhotoCountRow::getFolderId,
                                MemoryPhotoRepository.FolderPhotoCountRow::getTotal));

        return folders.stream().map(folder -> mapFolderToListDTO(folder, photoCounts)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FolderDTO getFolderById(UUID id) {
        MemoryFolder folder = folderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Folder not found"));
        return mapFolderToDTO(folder);
    }

    @Transactional
    public FolderDTO createFolder(FolderRequestDTO.CreateOrUpdateFolder request, Long userId) { // ✅ Long userId
        MemoryFolder folder = MemoryFolder.builder()
                .name(request.getName())
                .description(request.getDescription())
                .accentColor(request.getAccentColor() != null ? request.getAccentColor() : "#C73616")
                .iconStyle(request.getIconStyle() != null ? request.getIconStyle() : "camera")
                .coverImageUrl(request.getCoverImageUrl())
                .createdBy(userId)
                .isArchived(false)
                .eventDate(request.getEventDate())
                .isCalendarHighlight(request.getIsCalendarHighlight() != null ? request.getIsCalendarHighlight() : false)
                .build();
        // A brand-new folder never has photos yet, so highlightPhotoId stays null —
        // no calendar conflict is possible at creation time.

        folder = folderRepository.save(folder);
        activityLogService.log(userId, "MEMORY_FOLDER_CREATED", RelatedEntityType.MEMORY_FOLDER, folder.getId());
        notificationService.notifyOthers(userId, NotificationType.MEMORY_CREATED, folder.getName(),
                RelatedEntityType.MEMORY_FOLDER, folder.getId());

        return mapFolderToDTO(folder);
    }

    @Transactional
    public FolderDTO updateFolder(UUID id, FolderRequestDTO.CreateOrUpdateFolder request, boolean force, Long userId) {
        MemoryFolder folder = folderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Folder not found"));

        folder.setName(request.getName());
        folder.setDescription(request.getDescription());
        if (request.getAccentColor() != null) folder.setAccentColor(request.getAccentColor());
        if (request.getIconStyle() != null) folder.setIconStyle(request.getIconStyle());
        if (request.getCoverImageUrl() != null) folder.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getIsArchived() != null) folder.setIsArchived(request.getIsArchived());
        folder.setEventDate(request.getEventDate());

        boolean wantsCalendarHighlight = request.getIsCalendarHighlight() != null
                ? request.getIsCalendarHighlight()
                : Boolean.TRUE.equals(folder.getIsCalendarHighlight());
        folder.setIsCalendarHighlight(wantsCalendarHighlight);

        if (!wantsCalendarHighlight) {
            // Toggled off — remove the highlight from the calendar entirely.
            folder.setHighlightPhotoId(null);
        } else if (folder.getHighlightPhotoId() != null && folder.getEventDate() != null) {
            checkCalendarConflict(folder.getEventDate(), folder.getId(), force);
        }

        folder = folderRepository.save(folder);
        activityLogService.log(userId, "MEMORY_FOLDER_UPDATED", RelatedEntityType.MEMORY_FOLDER, folder.getId());
        notificationService.notifyOthers(userId, NotificationType.MEMORY_UPDATED, folder.getName(),
                RelatedEntityType.MEMORY_FOLDER, folder.getId());

        return mapFolderToDTO(folder);
    }

    // Looks for another folder already highlighting the same day. If found and
    // `force` is false, throws so the caller can offer a Replace/Keep choice; if
    // `force` is true, silently un-highlights the other folder instead.
    private void checkCalendarConflict(LocalDate eventDate, UUID excludeFolderId, boolean force) {
        Optional<MemoryFolder> conflict = folderRepository
                .findByEventDateAndIsCalendarHighlightTrueAndHighlightPhotoIdIsNotNullAndIdNot(eventDate, excludeFolderId);
        if (conflict.isEmpty()) return;

        MemoryFolder other = conflict.get();
        if (!force) {
            String photoUrl = photoRepository.findById(other.getHighlightPhotoId())
                    .map(MemoryPhoto::getPhotoUrl)
                    .orElse(null);
            throw new CalendarConflictException(
                    "This day already has a highlighted memory.",
                    CalendarConflictDTO.builder()
                            .conflictingFolderId(other.getId())
                            .conflictingFolderName(other.getName())
                            .conflictingHighlightPhotoUrl(photoUrl)
                            .eventDate(eventDate)
                            .build());
        }

        other.setHighlightPhotoId(null);
        folderRepository.save(other);
    }

    @Transactional
    public FolderDTO setCalendarHighlight(UUID folderId, UUID photoId, boolean force, Long userId) {
        MemoryFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new NotFoundException("Folder not found"));
        MemoryPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new NotFoundException("Photo not found"));

        if (!photo.getFolder().getId().equals(folderId)) {
            throw new IllegalArgumentException("That photo doesn't belong to this album.");
        }
        if (!Boolean.TRUE.equals(folder.getIsCalendarHighlight()) || folder.getEventDate() == null) {
            throw new IllegalArgumentException("Set a date and enable Calendar Dump for this album first.");
        }

        checkCalendarConflict(folder.getEventDate(), folder.getId(), force);

        // A newly-chosen photo starts centered — any saved crop position was
        // for the previous photo and wouldn't mean anything on this one.
        boolean photoChanged = !photoId.equals(folder.getHighlightPhotoId());
        folder.setHighlightPhotoId(photoId);
        if (photoChanged) {
            folder.setHighlightPhotoPositionX(50.0);
            folder.setHighlightPhotoPositionY(50.0);
        }
        folder = folderRepository.save(folder);

        activityLogService.log(userId, "MEMORY_FOLDER_UPDATED", RelatedEntityType.MEMORY_FOLDER, folder.getId());
        return mapFolderToDTO(folder);
    }

    @Transactional
    public FolderDTO clearCalendarHighlight(UUID folderId, Long userId) {
        MemoryFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new NotFoundException("Folder not found"));
        folder.setHighlightPhotoId(null);
        folder.setHighlightPhotoPositionX(50.0);
        folder.setHighlightPhotoPositionY(50.0);
        folder = folderRepository.save(folder);
        activityLogService.log(userId, "MEMORY_FOLDER_UPDATED", RelatedEntityType.MEMORY_FOLDER, folder.getId());
        return mapFolderToDTO(folder);
    }

    @Transactional
    public FolderDTO updateHighlightPosition(UUID folderId, double positionX, double positionY, Long userId) {
        MemoryFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new NotFoundException("Folder not found"));
        if (folder.getHighlightPhotoId() == null) {
            throw new IllegalArgumentException("This album has no calendar highlight to reposition.");
        }

        folder.setHighlightPhotoPositionX(clampPercent(positionX));
        folder.setHighlightPhotoPositionY(clampPercent(positionY));
        folder = folderRepository.save(folder);

        activityLogService.log(userId, "MEMORY_FOLDER_UPDATED", RelatedEntityType.MEMORY_FOLDER, folder.getId());
        return mapFolderToDTO(folder);
    }

    private double clampPercent(double value) {
        return Math.max(0, Math.min(100, value));
    }

    @Transactional(readOnly = true)
    public List<CalendarEntryDTO> getCalendarEntries(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        List<MemoryFolder> folders = folderRepository
                .findByEventDateBetweenAndIsCalendarHighlightTrueAndHighlightPhotoIdIsNotNull(start, end);

        return folders.stream().map(folder -> {
            String photoUrl = photoRepository.findById(folder.getHighlightPhotoId())
                    .map(MemoryPhoto::getPhotoUrl)
                    .orElse(null);
            return CalendarEntryDTO.builder()
                    .folderId(folder.getId())
                    .folderName(folder.getName())
                    .description(folder.getDescription())
                    .eventDate(folder.getEventDate())
                    .highlightPhotoUrl(photoUrl)
                    .highlightPhotoPositionX(folder.getHighlightPhotoPositionX())
                    .highlightPhotoPositionY(folder.getHighlightPhotoPositionY())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void deleteFolder(UUID id, Long userId) {
        MemoryFolder folder = folderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Folder not found"));
        String name = folder.getName();
        folderRepository.deleteById(id);
        activityLogService.log(userId, "MEMORY_FOLDER_DELETED", RelatedEntityType.MEMORY_FOLDER, id);
        notificationService.notifyOthers(userId, NotificationType.MEMORY_DELETED, name,
                RelatedEntityType.MEMORY_FOLDER, id);
    }

    @Transactional
    public PhotoDTO addPhotoToFolder(UUID folderId, String photoUrl, String storagePath, String caption, String location, Long userId) { // ✅ Long userId
        MemoryFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new NotFoundException("Folder not found"));

        MemoryPhoto photo = MemoryPhoto.builder()
                .folder(folder)
                .photoUrl(photoUrl)
                .storagePath(storagePath)
                .caption(caption)
                .location(location)
                .createdBy(userId)
                .isFavorite(false)
                .build();

        if (folder.getCoverImageUrl() == null || folder.getCoverImageUrl().isBlank()) {
            folder.setCoverImageUrl(photoUrl);
            folderRepository.save(folder);
        }

        photo = photoRepository.save(photo);
        activityLogService.log(userId, "MEMORY_PHOTO_UPLOADED", RelatedEntityType.MEMORY_PHOTO, photo.getId());
        notificationService.notifyOthers(userId, NotificationType.GALLERY_UPLOAD, folder.getName(),
                RelatedEntityType.MEMORY_PHOTO, photo.getId());

        return mapPhotoToDTO(photo);
    }

    @Transactional
    public PhotoDTO updatePhoto(UUID photoId, FolderRequestDTO.PhotoUpdate request) {
        MemoryPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new NotFoundException("Photo not found"));

        if (request.getCaption() != null) photo.setCaption(request.getCaption());
        if (request.getLocation() != null) photo.setLocation(request.getLocation());
        if (request.getIsFavorite() != null) photo.setIsFavorite(request.getIsFavorite());

        return mapPhotoToDTO(photoRepository.save(photo));
    }

    @Transactional
    public void deletePhoto(UUID photoId, Long userId) {
        MemoryPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new NotFoundException("Photo not found"));

        MemoryFolder folder = photo.getFolder();
        if (folder != null && photoId.equals(folder.getHighlightPhotoId())) {
            folder.setHighlightPhotoId(null);
            folderRepository.save(folder);
        }

        photoRepository.deleteById(photoId);
        activityLogService.log(userId, "MEMORY_PHOTO_DELETED", RelatedEntityType.MEMORY_PHOTO, photoId);
    }

    @Transactional(readOnly = true)
    public List<PhotoDTO> getFavorites() {
        return photoRepository.findByIsFavoriteTrueOrderByCreatedAtDesc().stream()
                .map(this::mapPhotoToDTO)
                .collect(Collectors.toList());
    }

    // List-endpoint variant: uses a pre-batched photo count instead of touching
    // the lazy `photos` collection, and omits the photo array entirely (the
    // grid view never reads it — see getAllFolders()).
    private FolderDTO mapFolderToListDTO(MemoryFolder folder, Map<UUID, Long> photoCounts) {
        return FolderDTO.builder()
                .id(folder.getId())
                .name(folder.getName())
                .description(folder.getDescription())
                .accentColor(folder.getAccentColor())
                .iconStyle(folder.getIconStyle())
                .coverImageUrl(folder.getCoverImageUrl())
                .isArchived(folder.getIsArchived())
                .photoCount(photoCounts.getOrDefault(folder.getId(), 0L).intValue())
                .createdAt(folder.getCreatedAt())
                .eventDate(folder.getEventDate())
                .isCalendarHighlight(folder.getIsCalendarHighlight())
                .highlightPhotoId(folder.getHighlightPhotoId())
                .highlightPhotoPositionX(folder.getHighlightPhotoPositionX())
                .highlightPhotoPositionY(folder.getHighlightPhotoPositionY())
                .photos(List.of())
                .build();
    }

    private FolderDTO mapFolderToDTO(MemoryFolder folder) {
        return FolderDTO.builder()
                .id(folder.getId())
                .name(folder.getName())
                .description(folder.getDescription())
                .accentColor(folder.getAccentColor())
                .iconStyle(folder.getIconStyle())
                .coverImageUrl(folder.getCoverImageUrl())
                .isArchived(folder.getIsArchived())
                .photoCount(folder.getPhotos() != null ? folder.getPhotos().size() : 0)
                .createdAt(folder.getCreatedAt())
                .eventDate(folder.getEventDate())
                .isCalendarHighlight(folder.getIsCalendarHighlight())
                .highlightPhotoId(folder.getHighlightPhotoId())
                .highlightPhotoPositionX(folder.getHighlightPhotoPositionX())
                .highlightPhotoPositionY(folder.getHighlightPhotoPositionY())
                .photos(folder.getPhotos() != null ?
                        folder.getPhotos().stream().map(this::mapPhotoToDTO).collect(Collectors.toList()) : List.of())
                .build();
    }

    private PhotoDTO mapPhotoToDTO(MemoryPhoto photo) {
        return PhotoDTO.builder()
                .id(photo.getId())
                .folderId(photo.getFolder().getId())
                .photoUrl(photo.getPhotoUrl())
                .storagePath(photo.getStoragePath())
                .caption(photo.getCaption())
                .location(photo.getLocation())
                .isFavorite(photo.getIsFavorite())
                .createdAt(photo.getCreatedAt())
                .build();
    }
} 