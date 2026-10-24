package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.service.BulkDeleteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * "Delete all" endpoints, one per section. Couple accounts and admins only (the app has no other
 * roles); the front end asks for a typed confirmation before it calls these.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class BulkDeleteController {

    private final BulkDeleteService bulkDeleteService;

    @DeleteMapping("/love-board/all")
    public ResponseEntity<Map<String, Object>> deleteLoveBoard() {
        return ResponseEntity.ok(bulkDeleteService.deleteLoveBoard());
    }

    @DeleteMapping("/memories/all")
    public ResponseEntity<Map<String, Object>> deleteMemories() {
        return ResponseEntity.ok(bulkDeleteService.deleteMemories());
    }

    @DeleteMapping("/dates/all")
    public ResponseEntity<Map<String, Object>> deleteDates() {
        return ResponseEntity.ok(bulkDeleteService.deleteDates());
    }
}
