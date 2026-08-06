package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.entity.AuditTrail;
import com.forsneakypea.fspbackend.exception.ResourceNotFoundException;
import com.forsneakypea.fspbackend.repository.AuditTrailRepository;
import com.forsneakypea.fspbackend.service.AuditTrailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/api/audit", "/api/v1/audit"})
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AuditController {

    private final AuditTrailService auditTrailService;
    private final AuditTrailRepository auditTrailRepository;

    @GetMapping
    public ResponseEntity<Page<AuditTrail>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(auditTrailService.list(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditTrail> getById(@PathVariable UUID id) {
        return auditTrailRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Audit entry not found: " + id));
    }
}
