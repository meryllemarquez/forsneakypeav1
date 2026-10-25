package com.forsneakypea.fspbackend.service;


import com.forsneakypea.fspbackend.exception.BadRequestException;
import com.forsneakypea.fspbackend.exception.NotFoundException;
import com.forsneakypea.fspbackend.dto.CalendarConflictDTO;
import com.forsneakypea.fspbackend.dto.request.AddPhotosBatchRequest;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemoryService {

    private final MemoryFolderRepository folderRepository;
    private final MemoryPhotoRepository photoRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final MediaUrlService mediaUrls;
    private final UploadService uploadService;
    private final DriveClient drive;

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

    private static final java.util.regex.Pattern DRIVE_ID = java.util.regex.Pattern.compile("^[A-Za-z0-9_-]{10,100}$");
    private static final String DEFAULT_ACCENT = "#FF9F1C";
    private static final java.util.regex.Pattern HEX_COLOR = java.util.regex.Pattern.compile("^#[0-9A-Fa-f]{6}$");

    /** Albums only accept a #RRGGBB colour (old albums may still hold legacy values, which load fine). */
    private static void requireValidAccent(String accent) {
        if (accent != null && !HEX_COLOR.matcher(accent).matches()) {
            throw new BadRequestException("Pick one of the album colours.");
        }
    }

    @Transactional
    public FolderDTO createFolder(FolderRequestDTO.CreateOrUpdateFolder request, Long userId) { // ✅ Long userId
        requireValidAccent(request.getAccentColor());
        MemoryFolder folder = MemoryFolder.builder()
                .name(request.getName())
                .description(request.getDescription())
                .accentColor(request.getAccentColor() != null ? request.getAccentColor() : DEFAULT_ACCENT)
                .iconStyle(request.getIconStyle() != null ? request.getIconStyle() : "camera")
                .coverImageUrl(mediaUrls.isSignedUrl(request.getCoverImageUrl()) ? null : request.getCoverImageUrl())
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

        return mapNewFolderToDTO(folder);
    }

    @Transactional
    public FolderDTO updateFolder(UUID id, FolderRequestDTO.CreateOrUpdateFolder request, boolean force, Long userId) {
        requireValidAccent(request.getAccentColor());
        MemoryFolder folder = folderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Folder not found"));

        folder.setName(request.getName());
        folder.setDescription(request.getDescription());
        if (request.getAccentColor() != null) folder.setAccentColor(request.getAccentColor());
        if (request.getIconStyle() != null) folder.setIconStyle(request.getIconStyle());
        applyCover(folder, request);
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

    // The cover is either one of this album's Drive photos (coverDriveFileId) or a legacy URL.
    // Signed media URLs expire, so one echoed back from a DTO is never stored.
    private void applyCover(MemoryFolder folder, FolderRequestDTO.CreateOrUpdateFolder request) {
        String driveId = request.getCoverDriveFileId();
        String url = request.getCoverImageUrl();
        if (driveId != null && !driveId.isBlank()) {
            if (!photoRepository.existsByFolderIdAndDriveFileId(folder.getId(), driveId)) {
                throw new BadRequestException("The cover must be a photo from this album.");
            }
            folder.setCoverDriveFileId(driveId);
            folder.setCoverImageUrl(null);
            return;
        }
        if (driveId != null) {
            folder.setCoverDriveFileId(null);
        }
        if (url != null && !mediaUrls.isSignedUrl(url)) {
            folder.setCoverImageUrl(url);
        }
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
                    .map(p -> mediaUrls.resolve(p.getPhotoUrl(), p.getDriveFileId(), MediaUrlService.Size.THUMB))
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

        // One IN query for every highlight photo URL instead of a findById per folder.
        List<UUID> photoIds = folders.stream().map(MemoryFolder::getHighlightPhotoId).distinct().collect(Collectors.toList());
        Map<UUID, String> photoUrls = new HashMap<>();
        if (!photoIds.isEmpty()) {
            for (MemoryPhotoRepository.PhotoUrlRow row : photoRepository.findPhotoUrlsByIds(photoIds)) {
                photoUrls.put(row.getId(), mediaUrls.resolve(row.getPhotoUrl(), row.getDriveFileId(), MediaUrlService.Size.LARGE));
            }
        }

        return folders.stream().map(folder -> {
            String photoUrl = photoUrls.get(folder.getHighlightPhotoId());
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
        Set<String> driveFiles = new HashSet<>();
        folder.getPhotos().forEach(p -> driveFiles.add(p.getDriveFileId()));
        driveFiles.add(folder.getCoverDriveFileId());
        folderRepository.deleteById(id);
        drive.trashAfterCommit(driveFiles);
        activityLogService.log(userId, "MEMORY_FOLDER_DELETED", RelatedEntityType.MEMORY_FOLDER, id);
        notificationService.notifyOthers(userId, NotificationType.MEMORY_DELETED, name,
                RelatedEntityType.MEMORY_FOLDER, id);
    }

    @Transactional
    public PhotoDTO addPhotoToFolder(UUID folderId, String driveFileId, String caption, String location, Long userId) { // ✅ Long userId
        MemoryFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new NotFoundException("Folder not found"));

        MemoryPhoto photo = createPhoto(folder, driveFileId, caption, location, userId);
        activityLogService.log(userId, "MEMORY_PHOTO_UPLOADED", RelatedEntityType.MEMORY_PHOTO, photo.getId());
        notificationService.notifyOthers(userId, NotificationType.GALLERY_UPLOAD, folder.getName(),
                RelatedEntityType.MEMORY_PHOTO, photo.getId());

        return mapPhotoToDTO(photo);
    }

    /**
     * Adds up to 20 already-uploaded photos in one request. Photos that fail validation are reported
     * in {@code failed} and do not stop the rest. The partner gets ONE notification, not one per photo.
     */
    @Transactional
    public Map<String, Object> addPhotosToFolder(UUID folderId, List<AddPhotosBatchRequest.Item> items, Long userId) {
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("Add at least one photo.");
        }
        if (items.size() > AddPhotosBatchRequest.MAX_ITEMS) {
            throw new BadRequestException("You can add up to " + AddPhotosBatchRequest.MAX_ITEMS + " photos at a time.");
        }
        MemoryFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new NotFoundException("Folder not found"));

        List<PhotoDTO> added = new ArrayList<>();
        List<Map<String, String>> failed = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        MemoryPhoto first = null;
        for (AddPhotosBatchRequest.Item item : items) {
            String id = item == null ? null : item.getDriveFileId();
            try {
                if (id == null || !DRIVE_ID.matcher(id).matches()) {
                    throw new BadRequestException("The uploaded photo is missing.");
                }
                if (!seen.add(id)) {
                    throw new BadRequestException("That photo was already added.");
                }
                MemoryPhoto photo = createPhoto(folder, id, item.getCaption(), item.getLocation(), userId);
                if (first == null) first = photo;
                added.add(mapPhotoToDTO(photo));
            } catch (BadRequestException e) {
                failed.add(Map.of("driveFileId", id == null ? "" : id, "reason", e.getMessage()));
            }
        }
        if (first != null) {
            activityLogService.log(userId, "MEMORY_PHOTO_UPLOADED", RelatedEntityType.MEMORY_PHOTO, first.getId());
            notificationService.notifyOthers(userId, NotificationType.GALLERY_UPLOAD, folder.getName(),
                    RelatedEntityType.MEMORY_PHOTO, first.getId());
        }
        return Map.of("added", added, "failed", failed);
    }

    /** Validates and saves one photo row (and makes it the album cover when the album has none). */
    private MemoryPhoto createPhoto(MemoryFolder folder, String driveFileId, String caption, String location, Long userId) {
        if (driveFileId == null || driveFileId.isBlank()) {
            throw new BadRequestException("The uploaded photo is missing.");
        }
        if (photoRepository.existsByDriveFileId(driveFileId)) {
            throw new BadRequestException("That photo was already added.");
        }
        uploadService.requireUploadedImage(driveFileId, "memories");

        MemoryPhoto photo = MemoryPhoto.builder()
                .folder(folder)
                .driveFileId(driveFileId)
                .caption(caption)
                .location(location)
                .createdBy(userId)
                .isFavorite(false)
                .build();

        boolean hasCover = (folder.getCoverImageUrl() != null && !folder.getCoverImageUrl().isBlank())
                || (folder.getCoverDriveFileId() != null && !folder.getCoverDriveFileId().isBlank());
        if (!hasCover) {
            folder.setCoverDriveFileId(driveFileId);
            folderRepository.save(folder);
        }
        return photoRepository.save(photo);
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
        if (folder != null) {
            boolean changed = false;
            if (photoId.equals(folder.getHighlightPhotoId())) {
                folder.setHighlightPhotoId(null);
                changed = true;
            }
            if (photo.getDriveFileId() != null && photo.getDriveFileId().equals(folder.getCoverDriveFileId())) {
                folder.setCoverDriveFileId(null);
                changed = true;
            }
            if (changed) {
                folderRepository.save(folder);
            }
        }

        photoRepository.deleteById(photoId);
        drive.trashAfterCommit(List.of(photo.getDriveFileId() == null ? "" : photo.getDriveFileId()));
        activityLogService.log(userId, "MEMORY_PHOTO_DELETED", RelatedEntityType.MEMORY_PHOTO, photoId);
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
                .coverImageUrl(mediaUrls.resolve(folder.getCoverImageUrl(), folder.getCoverDriveFileId(), MediaUrlService.Size.THUMB))
                .coverDriveFileId(folder.getCoverDriveFileId())
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

    // A folder that was just created has no photos, so there is nothing to load: building the
    // DTO from folder.getPhotos() would trigger a lazy SELECT just to find that out.
    private FolderDTO mapNewFolderToDTO(MemoryFolder folder) {
        return FolderDTO.builder()
                .id(folder.getId())
                .name(folder.getName())
                .description(folder.getDescription())
                .accentColor(folder.getAccentColor())
                .iconStyle(folder.getIconStyle())
                .coverImageUrl(mediaUrls.resolve(folder.getCoverImageUrl(), folder.getCoverDriveFileId(), MediaUrlService.Size.THUMB))
                .coverDriveFileId(folder.getCoverDriveFileId())
                .isArchived(folder.getIsArchived())
                .photoCount(0)
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
                .coverImageUrl(mediaUrls.resolve(folder.getCoverImageUrl(), folder.getCoverDriveFileId(), MediaUrlService.Size.THUMB))
                .coverDriveFileId(folder.getCoverDriveFileId())
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
                .photoUrl(mediaUrls.resolve(photo.getPhotoUrl(), photo.getDriveFileId(), MediaUrlService.Size.LARGE))
                .thumbUrl(mediaUrls.resolve(photo.getPhotoUrl(), photo.getDriveFileId(), MediaUrlService.Size.THUMB))
                .driveFileId(photo.getDriveFileId())
                .downloadUrl(photo.getDriveFileId() == null || photo.getDriveFileId().isBlank() ? null
                        : mediaUrls.downloadUrl(photo.getDriveFileId(), photo.getCaption()))
                .storagePath(photo.getStoragePath())
                .caption(photo.getCaption())
                .location(photo.getLocation())
                .isFavorite(photo.getIsFavorite())
                .createdAt(photo.getCreatedAt())
                .build();
    }
} 