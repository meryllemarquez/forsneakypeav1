package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.entity.ActivityLog;
import com.forsneakypea.fspbackend.entity.RelatedEntityType;
import com.forsneakypea.fspbackend.exception.ResourceNotFoundException;
import com.forsneakypea.fspbackend.repository.ActivityLogRepository;
import com.forsneakypea.fspbackend.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping({"/api/activity-logs", "/api/v1/activity-logs"})
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class ActivityLogController {

    private final ActivityLogService activityLogService;
    private final ActivityLogRepository activityLogRepository;

    @GetMapping
    public ResponseEntity<Page<ActivityLog>> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) RelatedEntityType module,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) OffsetDateTime from,
            @RequestParam(required = false) OffsetDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "desc") String sort) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, "createdAt"));
        return ResponseEntity.ok(activityLogService.search(userId, module, status, action, from, to, pageRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityLog> getById(@PathVariable UUID id) {
        return activityLogRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Activity log not found: " + id));
    }
}
