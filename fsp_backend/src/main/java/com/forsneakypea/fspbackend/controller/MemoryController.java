package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.CalendarEntryDTO;
import com.forsneakypea.fspbackend.dto.FolderDTO;
import com.forsneakypea.fspbackend.dto.FolderRequestDTO;
import com.forsneakypea.fspbackend.dto.PhotoDTO;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.MemoryService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/memories", "/api/v1/memories", "/memories"})
@RequiredArgsConstructor
public class MemoryController {

    private final MemoryService memoryService;

    @GetMapping("/folders")
    public ResponseEntity<List<FolderDTO>> getFolders(@RequestParam(defaultValue = "false") boolean includeArchived) {
        return ResponseEntity.ok(memoryService.getAllFolders(includeArchived));
    }

    @GetMapping("/folders/{id}")
    public ResponseEntity<FolderDTO> getFolderById(@PathVariable UUID id) {
        return ResponseEntity.ok(memoryService.getFolderById(id));
    }

    @PostMapping("/folders")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FolderDTO> createFolder(
            @Valid @RequestBody FolderRequestDTO.CreateOrUpdateFolder request) {
        
        Long currentUserId = getCurrentUserId(); // ✅ Long
        return ResponseEntity.ok(memoryService.createFolder(request, currentUserId));
    }

    @PutMapping("/folders/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FolderDTO> updateFolder(
            @PathVariable UUID id,
            @Valid @RequestBody FolderRequestDTO.CreateOrUpdateFolder request,
            @RequestParam(defaultValue = "false") boolean force) {
        return ResponseEntity.ok(memoryService.updateFolder(id, request, force, getCurrentUserId()));
    }

    @DeleteMapping("/folders/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteFolder(@PathVariable UUID id) {
        memoryService.deleteFolder(id, getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/folders/{folderId}/photos")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PhotoDTO> addPhotoToFolder(
            @PathVariable UUID folderId,
            @RequestBody AddPhotoPayload payload) {
        
        Long currentUserId = getCurrentUserId(); // ✅ Long
        return ResponseEntity.ok(memoryService.addPhotoToFolder(
                folderId,
                payload.getPhotoUrl(),
                payload.getStoragePath(),
                payload.getCaption(),
                payload.getLocation(),
                currentUserId
        ));
    }

    @PutMapping("/photos/{photoId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PhotoDTO> updatePhoto(
            @PathVariable UUID photoId,
            @RequestBody FolderRequestDTO.PhotoUpdate request) {
        return ResponseEntity.ok(memoryService.updatePhoto(photoId, request));
    }

    @DeleteMapping("/photos/{photoId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID photoId) {
        memoryService.deletePhoto(photoId, getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/photos/favorites")
    public ResponseEntity<List<PhotoDTO>> getFavorites() {
        return ResponseEntity.ok(memoryService.getFavorites());
    }

    @PostMapping("/folders/{folderId}/calendar-highlight/{photoId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FolderDTO> setCalendarHighlight(
            @PathVariable UUID folderId,
            @PathVariable UUID photoId,
            @RequestParam(defaultValue = "false") boolean force) {
        return ResponseEntity.ok(memoryService.setCalendarHighlight(folderId, photoId, force, getCurrentUserId()));
    }

    @DeleteMapping("/folders/{folderId}/calendar-highlight")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FolderDTO> clearCalendarHighlight(@PathVariable UUID folderId) {
        return ResponseEntity.ok(memoryService.clearCalendarHighlight(folderId, getCurrentUserId()));
    }

    @PatchMapping("/folders/{folderId}/calendar-highlight/position")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FolderDTO> updateHighlightPosition(
            @PathVariable UUID folderId,
            @Valid @RequestBody FolderRequestDTO.PositionUpdate request) {
        return ResponseEntity.ok(memoryService.updateHighlightPosition(
                folderId, request.getPositionX(), request.getPositionY(), getCurrentUserId()));
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<CalendarEntryDTO>> getCalendarEntries(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(memoryService.getCalendarEntries(year, month));
    }

    // ✅ FIXED: Returns Long to match User.java (private Long id)
    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        return null;
    }

    @Data
    public static class AddPhotoPayload {
        private String photoUrl;
        private String storagePath;
        private String caption;
        private String location;
    }
}