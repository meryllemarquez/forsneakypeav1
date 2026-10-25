package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.BouquetDTO;
import com.forsneakypea.fspbackend.dto.request.BouquetRequest;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.BouquetService;
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
@RequestMapping("/api/v1/bouquets")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class BouquetController {

    private final BouquetService bouquetService;

    @GetMapping
    public ResponseEntity<List<BouquetDTO>> list() {
        return ResponseEntity.ok(bouquetService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BouquetDTO> get(@PathVariable UUID id) {
        return ResponseEntity.ok(bouquetService.get(id));
    }

    @PostMapping
    public ResponseEntity<BouquetDTO> create(@Valid @RequestBody BouquetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bouquetService.create(request, getCurrentUserId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BouquetDTO> update(@PathVariable UUID id, @Valid @RequestBody BouquetRequest request) {
        return ResponseEntity.ok(bouquetService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        bouquetService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof User user ? user.getId() : null;
    }
}
