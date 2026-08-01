package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.DateEntryDTO;
import com.forsneakypea.fspbackend.dto.DateRequestDTO;
import com.forsneakypea.fspbackend.dto.response.ApiResponse;
import com.forsneakypea.fspbackend.entity.DateStatus;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.DateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/dates", "/api/v1/dates"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DateController {

    private final DateService dateService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DateEntryDTO>> createDate(
            @Valid @RequestBody DateRequestDTO.Create request) {
        DateEntryDTO created = dateService.createDate(request, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(created, "Date created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DateEntryDTO>>> getDates(
            @RequestParam(defaultValue = "false") boolean includeArchived,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) DateStatus status) {
        List<DateEntryDTO> dates = dateService.getDates(includeArchived, categoryId, status, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(dates, "Dates retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DateEntryDTO>> getDateById(@PathVariable UUID id) {
        DateEntryDTO date = dateService.getDateById(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(date, "Date retrieved successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DateEntryDTO>> updateDate(
            @PathVariable UUID id,
            @Valid @RequestBody DateRequestDTO.Update request) {
        DateEntryDTO updated = dateService.updateDate(id, request, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Date updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteDate(@PathVariable UUID id) {
        dateService.deleteDate(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Date deleted successfully"));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DateEntryDTO>> archiveDate(@PathVariable UUID id) {
        DateEntryDTO archived = dateService.archiveDate(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(archived, "Date archived successfully"));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DateEntryDTO>> restoreDate(@PathVariable UUID id) {
        DateEntryDTO restored = dateService.restoreDate(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(restored, "Date restored successfully"));
    }

    @PostMapping("/{id}/unarchive")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DateEntryDTO>> unarchiveDate(@PathVariable UUID id) {
        DateEntryDTO unarchived = dateService.unarchiveDate(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(unarchived, "Date unarchived successfully"));
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DateEntryDTO>> duplicateDate(@PathVariable UUID id) {
        DateEntryDTO duplicate = dateService.duplicateDate(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(duplicate, "Date duplicated successfully"));
    }

    @PostMapping("/{id}/favorite")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DateEntryDTO>> favoriteDate(@PathVariable UUID id) {
        DateEntryDTO updated = dateService.setFavorite(id, true, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Date favorited successfully"));
    }

    @DeleteMapping("/{id}/favorite")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DateEntryDTO>> unfavoriteDate(@PathVariable UUID id) {
        DateEntryDTO updated = dateService.setFavorite(id, false, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Date unfavorited successfully"));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        return null;
    }
}
