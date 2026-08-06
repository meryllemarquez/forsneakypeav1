package com.forsneakypea.fspbackend.service;


import com.forsneakypea.fspbackend.dto.FolderDTO;
import com.forsneakypea.fspbackend.dto.FolderRequestDTO;
import com.forsneakypea.fspbackend.dto.PhotoDTO;
import com.forsneakypea.fspbackend.entity.MemoryFolder;
import com.forsneakypea.fspbackend.entity.MemoryPhoto;
import com.forsneakypea.fspbackend.entity.NotificationType;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.repository.MemoryFolderRepository;
import com.forsneakypea.fspbackend.repository.MemoryPhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

        return folders.stream().map(this::mapFolderToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FolderDTO getFolderById(UUID id) {
        MemoryFolder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder not found"));
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
                .build();

        folder = folderRepository.save(folder);
        activityLogService.log(userId, "MEMORY_FOLDER_CREATED", RelatedEntityType.MEMORY_FOLDER, folder.getId());
        notificationService.notifyOthers(userId, NotificationType.MEMORY_CREATED, folder.getName(),
                RelatedEntityType.MEMORY_FOLDER, folder.getId());

        return mapFolderToDTO(folder);
    }

    @Transactional
    public FolderDTO updateFolder(UUID id, FolderRequestDTO.CreateOrUpdateFolder request, Long userId) {
        MemoryFolder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        folder.setName(request.getName());
        folder.setDescription(request.getDescription());
        if (request.getAccentColor() != null) folder.setAccentColor(request.getAccentColor());
        if (request.getIconStyle() != null) folder.setIconStyle(request.getIconStyle());
        if (request.getCoverImageUrl() != null) folder.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getIsArchived() != null) folder.setIsArchived(request.getIsArchived());

        folder = folderRepository.save(folder);
        activityLogService.log(userId, "MEMORY_FOLDER_UPDATED", RelatedEntityType.MEMORY_FOLDER, folder.getId());
        notificationService.notifyOthers(userId, NotificationType.MEMORY_UPDATED, folder.getName(),
                RelatedEntityType.MEMORY_FOLDER, folder.getId());

        return mapFolderToDTO(folder);
    }

    @Transactional
    public void deleteFolder(UUID id, Long userId) {
        MemoryFolder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder not found"));
        String name = folder.getName();
        folderRepository.deleteById(id);
        activityLogService.log(userId, "MEMORY_FOLDER_DELETED", RelatedEntityType.MEMORY_FOLDER, id);
        notificationService.notifyOthers(userId, NotificationType.MEMORY_DELETED, name,
                RelatedEntityType.MEMORY_FOLDER, id);
    }

    @Transactional
    public PhotoDTO addPhotoToFolder(UUID folderId, String photoUrl, String storagePath, String caption, String location, Long userId) { // ✅ Long userId
        MemoryFolder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

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
                .orElseThrow(() -> new RuntimeException("Photo not found"));

        if (request.getCaption() != null) photo.setCaption(request.getCaption());
        if (request.getLocation() != null) photo.setLocation(request.getLocation());
        if (request.getIsFavorite() != null) photo.setIsFavorite(request.getIsFavorite());

        return mapPhotoToDTO(photoRepository.save(photo));
    }

    @Transactional
    public void deletePhoto(UUID photoId, Long userId) {
        photoRepository.deleteById(photoId);
        activityLogService.log(userId, "MEMORY_PHOTO_DELETED", RelatedEntityType.MEMORY_PHOTO, photoId);
    }

    @Transactional(readOnly = true)
    public List<PhotoDTO> getFavorites() {
        return photoRepository.findByIsFavoriteTrueOrderByCreatedAtDesc().stream()
                .map(this::mapPhotoToDTO)
                .collect(Collectors.toList());
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