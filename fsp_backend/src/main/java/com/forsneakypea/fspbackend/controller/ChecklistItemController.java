package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.ChecklistItemDTO;
import com.forsneakypea.fspbackend.dto.ChecklistItemRequestDTO;
import com.forsneakypea.fspbackend.dto.response.ApiResponse;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.ChecklistItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/dates/{dateId}/checklist-items", "/api/v1/dates/{dateId}/checklist-items"})
@RequiredArgsConstructor
public class ChecklistItemController {

    private final ChecklistItemService checklistItemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChecklistItemDTO>>> getItems(@PathVariable UUID dateId) {
        return ResponseEntity.ok(ApiResponse.success(
                checklistItemService.getItemsForDate(dateId), "Checklist items retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ChecklistItemDTO>> createItem(
            @PathVariable UUID dateId,
            @Valid @RequestBody ChecklistItemRequestDTO.Create request) {
        ChecklistItemDTO created = checklistItemService.createItem(dateId, request, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(created, "Checklist item added successfully"));
    }

    @PutMapping("/{itemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ChecklistItemDTO>> updateItem(
            @PathVariable UUID dateId,
            @PathVariable UUID itemId,
            @Valid @RequestBody ChecklistItemRequestDTO.Update request) {
        ChecklistItemDTO updated = checklistItemService.updateItem(itemId, request, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Checklist item updated successfully"));
    }

    @DeleteMapping("/{itemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable UUID dateId, @PathVariable UUID itemId) {
        checklistItemService.deleteItem(itemId);
        return ResponseEntity.ok(ApiResponse.success(null, "Checklist item deleted successfully"));
    }

    @PutMapping("/reorder")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ChecklistItemDTO>>> reorderItems(
            @PathVariable UUID dateId,
            @Valid @RequestBody ChecklistItemRequestDTO.Reorder request) {
        List<ChecklistItemDTO> reordered = checklistItemService.reorderItems(dateId, request.getOrderedIds());
        return ResponseEntity.ok(ApiResponse.success(reordered, "Checklist reordered successfully"));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        return null;
    }
}
