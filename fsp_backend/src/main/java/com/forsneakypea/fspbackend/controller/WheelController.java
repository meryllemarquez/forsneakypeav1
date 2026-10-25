package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.WheelDTO;
import com.forsneakypea.fspbackend.dto.WheelSpinDTO;
import com.forsneakypea.fspbackend.dto.request.WheelRequest;
import com.forsneakypea.fspbackend.dto.request.WheelSpinRequest;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.WheelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wheels")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class WheelController {

    private final WheelService wheelService;

    @GetMapping
    public ResponseEntity<List<WheelDTO>> list() {
        return ResponseEntity.ok(wheelService.list());
    }

    @PostMapping
    public ResponseEntity<WheelDTO> create(@Valid @RequestBody WheelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wheelService.create(request, getCurrentUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WheelDTO> update(@PathVariable UUID id, @Valid @RequestBody WheelRequest request) {
        return ResponseEntity.ok(wheelService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        wheelService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/spins")
    public ResponseEntity<WheelSpinDTO> addSpin(@PathVariable UUID id, @Valid @RequestBody WheelSpinRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wheelService.addSpin(id, request, getCurrentUserId()));
    }

    @GetMapping("/{id}/spins")
    public ResponseEntity<List<WheelSpinDTO>> listSpins(@PathVariable UUID id,
                                                        @RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(wheelService.listSpins(id, limit));
    }

    @DeleteMapping("/{id}/spins")
    public ResponseEntity<Void> clearSpins(@PathVariable UUID id) {
        wheelService.clearSpins(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/spins/{spinId}")
    public ResponseEntity<WheelSpinDTO> setAccepted(@PathVariable UUID spinId, @RequestBody WheelSpinRequest request) {
        return ResponseEntity.ok(wheelService.setAccepted(spinId, request));
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof User user ? user.getId() : null;
    }
}
